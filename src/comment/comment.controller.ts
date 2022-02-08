import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { CommentService } from './comment.service';
import { CommentQueryDto } from './dto/request/comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  getComments(
    @Param() param: ProjectParamsDto,
    @Query() query: CommentQueryDto,
  ) {
    return this.commentService.getComments;
  }
}
