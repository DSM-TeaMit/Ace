import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { LoginResponseDto } from './dto/response/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RegisterAdminRequestDto } from './dto/request/register-admin.dto';

interface GithubResponse {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminRepository: AdminRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async googleLogin(req: Request): Promise<LoginResponseDto> {
    if (req.user.email.split('@')[1] !== 'dsm.hs.kr')
      throw new ForbiddenException();
    const user = await this.userRepository.findOne(req.user.email);
    if (user?.deleted) throw new UnprocessableEntityException();
    const isUserExist = Boolean(user);
    const payload: JwtPayload = {
      sub: user?.uuid || req.user.email,
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
    const { githubToken, githubId } = req.user;
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
    this.cacheManager.set(githubResponse[0].email, githubId, {
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

  async registerAdmin(payload: RegisterAdminRequestDto) {
    payload.password = await bcrypt.hash(payload.password, 12);
    return await this.adminRepository.insertOne(payload);
  }
}
