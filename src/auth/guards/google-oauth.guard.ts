import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: Error, user: any) {
    if (err) {
      if (err.message === 'Bad Request') throw new UnauthorizedException();
      else throw err;
    }
    return user;
  }
}
