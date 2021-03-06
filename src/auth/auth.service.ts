import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
import { Admin } from 'src/shared/entities/admin/admin.entity';
import { RefreshTokenRequestDto } from './dto/request/refresh-token.dto';
import { RefreshTokenResponseDto } from './dto/response/refresh.dto';

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
    if (req.user.hd !== 'dsm.hs.kr') throw new ForbiddenException();
    const user = await this.userRepository.findOne(req.user.email);
    if (!user) throw new NotFoundException();
    if (user?.deleted) throw new UnprocessableEntityException();
    if (user?.thumbnailUrl !== req.user.picture)
      await this.userRepository.updateThumbnailUrl(user.id, req.user.picture);
    const payload: JwtPayload = {
      sub: user?.uuid || req.user.email,
      role: 'user',
      picture: req.user.picture,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    await this.cacheManager.del(refreshToken);
    await this.cacheManager.set(refreshToken, user.uuid, { ttl: 604800 });
    return new LoginResponseDto(user, accessToken, refreshToken);
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
    };
    const { userInfo }: { userInfo: Admin } = req.user;
    return new LoginResponseDto(
      userInfo,
      this.jwtService.sign(payload),
      this.jwtService.sign(payload, { expiresIn: '7d' }),
    );
  }

  async registerAdmin(
    req: Request,
    payload: RegisterAdminRequestDto,
  ): Promise<void> {
    payload.password = await bcrypt.hash(payload.password, 12);
    const admin = await this.adminRepository.findOne({
      uuid: req.user.userId,
    });
    await this.adminRepository.insertOne(admin, payload);
    return;
  }

  async refresh(
    payload: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    interface Payload {
      sub: string;
      role: string;
      iat: number;
      exp: number;
    }

    const tokenPayload = await (async (): Promise<Payload> => {
      try {
        return await this.jwtService.verifyAsync(payload.refreshToken);
      } catch (e) {
        throw new UnauthorizedException();
      }
    })();
    const cache = await this.cacheManager.get<string>(payload.refreshToken);
    const admin = await this.adminRepository.findOne({ uuid: cache });
    const user = await this.userRepository.findOne(undefined, cache);
    if (cache !== (user?.uuid ?? admin?.uuid))
      throw new UnauthorizedException();

    const accessToken = this.jwtService.sign({
      sub: tokenPayload.sub,
      role: user ? 'user' : 'admin',
    });
    const refreshToken = this.jwtService.sign({
      sub: tokenPayload.sub,
      role: user ? 'user' : 'admin',
    });
    await this.cacheManager.del(payload.refreshToken);
    await this.cacheManager.set(refreshToken, tokenPayload.sub, {
      ttl: 604800,
    });
    return new RefreshTokenResponseDto(accessToken, refreshToken);
  }
}
