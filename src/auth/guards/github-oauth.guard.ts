import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubOauthGuard extends AuthGuard('github') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any) {
    if (err) {
      if (err.message === 'The code passed is incorrect or expired.')
        throw new UnauthorizedException();
      else throw err;
    }
    return user;
  }
}
