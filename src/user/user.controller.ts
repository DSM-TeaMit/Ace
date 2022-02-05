import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, JwtRegistrationGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import {
  ProfileRequestDto,
  ProfileRequestQueryDto,
} from './dto/request/profile.dto';
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
  async getProfile(@Req() req: Request, @Param() payload: ProfileRequestDto) {
    return this.userService.getProfile(req, payload);
  }

  @Get('profile/projects')
  @UseGuards(JwtAuthGuard)
  async getProjects(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileRequestQueryDto,
  ) {
    return this.userService.getProjects(req, param, query);
  }

  @Get('profile/:uuid')
  @UseGuards(JwtAuthGuard)
  async getProfileWithUuid(
    @Req() req: Request,
    @Param() payload: ProfileRequestDto,
  ) {
    return this.userService.getProfile(req, payload);
  }

  @Get('profile/:uuid/projects')
  @UseGuards(JwtAuthGuard)
  async getProjectsWithUuid(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileRequestQueryDto,
  ) {
    return this.userService.getProjects(req, param, query);
  }
}
