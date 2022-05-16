import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleOauthStrategy } from './strategies/google-oauth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { GithubOauthStrategy } from './strategies/github-oauth.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 604800,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([AdminRepository, UserRepository]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GithubOauthStrategy,
    GoogleOauthStrategy,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
