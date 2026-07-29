import { authService } from '../../../services/auth.service';
import { withValidatedResolver } from '../../utils/validation';
import { loginInputSchema } from '../../../validators/schemas/auth.schemas';

export const authResolvers = {
  Mutation: {
    login: withValidatedResolver(
      loginInputSchema,
      async (_: unknown, { email, password }: { email: string; password: string }) => {
        return authService.login(email, password);
      },
      'login'
    ),
  },
};
