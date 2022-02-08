import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CommentQueryDto } from './dto/request/comment.dto';
import { GetCommentResponseDto } from './dto/response/get-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly projectRepository: ProjectRepository,
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
        writerId: comment.adminId?.uuid ?? comment.userId?.uuid,
        writerType: comment.adminId ? 'admin' : 'user',
        writerName: comment.adminId?.name ?? comment.userId?.name,
        writerSno: comment.userId?.studentNo,
        content: comment.content,
      })),
    };
  }
}
