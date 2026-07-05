import { GraphQLError } from 'graphql';
import { z } from 'zod';
import { errorHandler } from '../../shared/errors';
import { withErrorHandling } from './error-handler';
import type { GraphQLContext } from '../server';

export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code?: string;
}

/**
 * Wrapper function that adds Zod validation to a GraphQL resolver.
 * Validates args.input or args directly before executing the resolver.
 */
export function withValidation<TSchema extends z.ZodType>(
  schema: TSchema,
  resolver: (parent: any, args: any, context: GraphQLContext) => Promise<any>
) {
  return async (parent: any, args: any, context: GraphQLContext): Promise<any> => {
    try {
      const hasArgsBeyondInput =
        args.input !== undefined &&
        Object.keys(args).some((key) => key !== 'input' && args[key] !== undefined);

      const dataToValidate = hasArgsBeyondInput
        ? args
        : args.input !== undefined
          ? args.input
          : args;

      const validated = schema.parse(dataToValidate);

      const validatedArgs = hasArgsBeyondInput
        ? validated
        : args.input !== undefined
          ? { ...args, input: validated }
          : validated;

      return await resolver(parent, validatedArgs, context);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationErrorDetail[] = error.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        }));

        errorHandler.logWarning('GraphQL validation failed', {
          userId: context.user?.id,
          context: {
            graphql: true,
            validationErrors,
            args: sanitizeArgs(args),
          },
        });

        throw new GraphQLError('Validation failed', {
          extensions: {
            code: 'BAD_USER_INPUT',
            validationErrors,
          },
        });
      }

      throw error;
    }
  };
}

/**
 * Combined wrapper that adds both validation and error handling.
 * Recommended way to build resolvers for a new domain module.
 */
export function withValidatedResolver<TSchema extends z.ZodType>(
  schema: TSchema,
  resolver: (parent: any, args: any, context: GraphQLContext) => Promise<any>,
  operationName: string
) {
  return withErrorHandling(withValidation(schema, resolver), operationName);
}

function sanitizeArgs(args: any): any {
  if (!args) return {};

  const sanitized = { ...args };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  if (sanitized.input && typeof sanitized.input === 'object') {
    for (const field of sensitiveFields) {
      if (field in sanitized.input) {
        sanitized.input[field] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}
