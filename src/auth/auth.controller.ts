import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { AuthService } from './auth.service';
import { RefreshTokenRequestDto } from './dto/request/refresh-token.dto';
import { RegisterAdminRequestDto } from './dto/request/register-admin.dto';
import { LoginResponseDto } from './dto/response/login.dto';
import { GithubOauthGuard } from './guards/github-oauth.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @Get('callback-google')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req: Request): Promise<LoginResponseDto> {
    return this.authService.googleLogin(req);
  }

  @Get('github')
  @Redirect(undefined, 302)
  async githubAuth(@Query('redirectUri') redirectUri: string) {
    return {
      url: `https://github.com/login/oauth/authorize?response_type=code&redirect_uri=${
        process.env.GITHUB_OAUTH_REDIRECT_URL
      }/${redirectUri ?? ''}&scope=user%3Aemail&client_id=12f5bbad8d4b6573db40`,
    };
  }

  @Get('callback-github')
  @HttpCode(204)
  @UseGuards(GithubOauthGuard)
  async githubAuthRedirect(@Req() req: Request) {
    return this.authService.githubLogin(req);
  }

  @Post('uidlogin')
  @UseGuards(LocalGuard)
  async uidLogin(@Req() req: Request) {
    return this.authService.uidLogin(req);
  }

  @Post('register-admin')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard)
  @UseGuards(RolesGuard)
  async registerAdmin(
    @Req() req: Request,
    @Body() payload: RegisterAdminRequestDto,
  ) {
    return this.authService.registerAdmin(req, payload);
  }

  @Put('refresh')
  async refresh(@Body() payload: RefreshTokenRequestDto) {
    return this.authService.refresh(payload);
  }
}
