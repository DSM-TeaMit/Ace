import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminRepository,
      CommentRepository,
      ProjectRepository,
      UserRepository,
    ]),
  ],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
