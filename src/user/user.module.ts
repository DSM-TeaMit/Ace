import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { ExcelModule } from 'src/excel/excel.module';
import { FileModule } from 'src/file/file.module';
import { ProjectModule } from 'src/project/project.module';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 604800,
    }),
    TypeOrmModule.forFeature([
      AdminRepository,
      ProjectRepository,
      UserRepository,
    ]),
    ExcelModule,
    FileModule,
    ProjectModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
