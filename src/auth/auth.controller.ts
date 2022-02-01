import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthTokenResponseDto } from './dto/response/google-auth.dto';
import { GithubOauthGuard } from './guards/github-oauth.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('callback-google')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(
    @Req() req: Request,
  ): Promise<GoogleAuthTokenResponseDto> {
    return this.authService.googleLogin(req);
  }

  @Get('github')
  @UseGuards(GithubOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async githubAuth() {}

  @Get('callback-github')
  @HttpCode(204)
  @UseGuards(GithubOauthGuard)
  async githubAuthRedirect(@Req() req: Request) {
    return this.authService.githubLogin(req);
  }
}
