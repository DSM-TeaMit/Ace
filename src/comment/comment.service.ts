import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { v4 } from 'uuid';
import { CommentQueryDto } from './dto/request/comment.dto';
import { CreateCommentRequestDto } from './dto/request/create-comment.dto';
import { GetCommentResponseDto } from './dto/response/get-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly commentRepository: CommentRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async getComments(
    param: ProjectParamsDto,
    query: CommentQueryDto,
  ): Promise<GetCommentResponseDto> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    const comments = await this.commentRepository.findMany(
      project.id,
      query.type.toUpperCase() as 'PROJECT' | 'PLAN' | 'REPORT',
    );
    return {
      count: comments[1],
      comments: comments[0].map((comment) => ({
        uuid: comment.uuid,
        writerId: comment.adminId?.uuid ?? comment.userId?.uuid,
        writerType: comment.adminId ? 'admin' : 'user',
        writerName: comment.adminId?.name ?? comment.userId?.name,
        writerSno: comment.userId?.studentNo,
        content: comment.content,
      })),
    };
  }

  async createComments(
    payload: CreateCommentRequestDto,
    param: ProjectParamsDto,
    req: Request,
  ) {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();

    const adminId =
      req.user.role === 'admin'
        ? (
            await this.adminRepository.findOne(undefined, req.user.userId)
          ).id.toString()
        : undefined;
    const userId =
      req.user.role === 'user'
        ? (
            await this.userRepository.findOne(undefined, req.user.userId)
          ).id.toString()
        : undefined;

    await this.commentRepository.createComment(
      project.id,
      payload.type.toUpperCase() as 'PROJECT' | 'PLAN' | 'REPORT',
      {
        uuid: v4(),
        adminId: () => adminId,
        userId: () => userId,
        content: payload.content,
      },
    );
    return;
  }

  async deleteComment(param: ProjectParamsDto, req: Request): Promise<void> {
    const comment = await this.commentRepository.findOne(param.uuid);
    if (!comment) throw new NotFoundException();
    if ((comment.adminId?.uuid ?? comment.userId?.uuid) !== req.user.userId)
      throw new ForbiddenException();

    await this.commentRepository.delete(param.uuid);
    return;
  }
}
