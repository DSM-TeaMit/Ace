import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { GoogleAuthTokenResponseDto } from './dto/response/google-auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async googleLogin(req: Request): Promise<GoogleAuthTokenResponseDto> {
    const user = await this.userRepository.findOne(req.user.email);
    const isUserExist = Boolean(user);
    const payload: JwtPayload = {
      sub: req.user.email,
      role: 'user',
      registrationOnly: !isUserExist,
    };
    return {
      type: isUserExist ? 'login' : 'registration',
      accessToken: this.jwtService.sign(payload),
      refreshToken: isUserExist
        ? this.jwtService.sign(payload, { expiresIn: '7d' })
        : undefined,
    };
  }
}
