import { Module } from '@nestjs/common';
import { ProjectService } from './services/project.service';
import { ProjectController } from './controllers/project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { FeedService } from './services/feed.service';
import { FeedController } from './controllers/feed.controller';
import { PlanService } from './services/plan.service';
import { PlanController } from './controllers/plan.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommentRepository,
      ProjectRepository,
      UserRepository,
    ]),
  ],
  providers: [FeedService, PlanService, ProjectService],
  controllers: [FeedController, PlanController, ProjectController],
})
export class ProjectModule {}
