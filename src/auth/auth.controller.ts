import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { AuthService } from './auth.service';
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
  @UseGuards(GithubOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async githubAuth() {}

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
  async registerAdmin(@Body() payload: RegisterAdminRequestDto) {
    return this.authService.registerAdmin(payload);
  }
}
