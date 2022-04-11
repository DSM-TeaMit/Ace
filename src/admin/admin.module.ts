import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 604800,
    }),
    TypeOrmModule.forFeature([AdminRepository]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
