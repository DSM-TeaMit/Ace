import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommentRepository,
      ProjectRepository,
      UserRepository,
    ]),
  ],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
