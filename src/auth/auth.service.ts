import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { LoginResponseDto } from './dto/response/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import axios from 'axios';

interface GithubResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async googleLogin(req: Request): Promise<LoginResponseDto> {
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

  async githubLogin(req: Request): Promise<void> {
    const { githubToken } = req.user;
    const githubResponse = (
      await axios
        .get<GithubResponse[]>(
          `${process.env.GITHUB_API_BASE_URL}/user/emails`,
          {
            headers: {
              Authorization: 'token ' + githubToken,
            },
          },
        )
        .catch(() => {
          throw new InternalServerErrorException();
        })
    ).data.filter(
      (res) => res.verified && res.email.split('@')[1] === 'dsm.hs.kr',
    );
    if (!githubResponse.length) throw new UnauthorizedException();
    this.cacheManager.set(githubResponse[0].email, 'GITHUB_VERIFIED', {
      ttl: 1200,
    });
    return;
  }

  async uidLogin(req: Request): Promise<LoginResponseDto> {
    const payload: JwtPayload = {
      sub: req.user.userId,
      role: 'admin',
      registrationOnly: false,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
