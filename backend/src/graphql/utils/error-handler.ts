import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { errorHandler, type ErrorMetadata } from '../../shared/errors';
import type { GraphQLContext } from '../server';

/**
 * Wrapper function for GraphQL resolvers with centralized error handling
 */
export function withErrorHandling<TArgs = any, TResult = any>(
  resolver: (parent: any, args: TArgs, context: GraphQLContext) => Promise<TResult>,
  operationName: string
) {
  return async (parent: any, args: TArgs, context: GraphQLContext): Promise<TResult> => {
    try {
      if (context.user?.id) {
        errorHandler.setUserContext(context.user.id);
      }

      return await resolver(parent, args, context);
    } catch (error: any) {
      const metadata: ErrorMetadata = {
        userId: context.user?.id,
        operation: operationName,
        context: {
          args: sanitizeArgs(args),
          graphql: true,
        },
      };

      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        }));

        errorHandler.logWarning(`GraphQL validation failed in ${operationName}`, {
          ...metadata,
          context: {
            ...metadata.context,
            validationErrors,
          },
        });

        throw new GraphQLError('Validation failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            validationErrors,
          },
        });
      }

      if (error instanceof GraphQLError) {
        errorHandler.logInfo(
          `GraphQL operation ${operationName} failed: ${error.message}`,
          metadata
        );
        throw error;
      }

      errorHandler.handleError(error, metadata);

      throw new GraphQLError(error.message, {
        extensions: {
          code: error.name || 'INTERNAL_SERVER_ERROR',
          statusCode: error.statusCode,
        },
      });
    }
  };
}

export function requireAuth(context: GraphQLContext, operationName: string): void {
  if (!context.user) {
    errorHandler.logWarning('Unauthenticated access attempt', {
      operation: operationName,
      context: { graphql: true },
    });

    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

function sanitizeArgs(args: any): any {
  if (!args) return {};

  const sanitized = { ...args };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
    if (sanitized.input && typeof sanitized.input === 'object') {
      for (const inputField of sensitiveFields) {
        if (inputField in sanitized.input) {
          sanitized.input[inputField] = '[REDACTED]';
        }
      }
    }
  }

  return sanitized;
}
