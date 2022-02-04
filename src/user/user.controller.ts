import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, JwtRegistrationGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ProfileMainRequestDto } from './dto/request/profile-main.dto';
import { RegisterUserRequestDto } from './dto/request/register-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtRegistrationGuard)
  async register(@Req() req: Request, @Body() payload: RegisterUserRequestDto) {
    return this.userService.register(req, payload);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Req() req: Request,
    @Param() payload: ProfileMainRequestDto,
  ) {
    return this.userService.getProfile(req, payload);
  }

  @Get('profile/:uuid')
  @UseGuards(JwtAuthGuard)
  async getProfileWithUuid(
    @Req() req: Request,
    @Param() payload: ProfileMainRequestDto,
  ) {
    return this.userService.getProfile(req, payload);
  }
}
