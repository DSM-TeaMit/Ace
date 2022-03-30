import { CacheModule, Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { ProjectController } from './controllers/project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { FeedService } from './services/feed.service';
import { FeedController } from './controllers/feed.controller';
import { PlanService } from './services/plan.service';
import { PlanController } from './controllers/plan.controller';
import { ReportController } from './controllers/report.controller';
import { ReportService } from './services/report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommentRepository,
      ProjectRepository,
      UserRepository,
    ]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 86400,
    }),
  ],
  providers: [FeedService, PlanService, ProjectService, ReportService],
  controllers: [
    FeedController,
    PlanController,
    ProjectController,
    ReportController,
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
