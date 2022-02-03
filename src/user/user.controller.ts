import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtRegistrationGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
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
}
