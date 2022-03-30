import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { CommentService } from './comment.service';
import { CommentQueryDto } from './dto/request/comment.dto';
import { CreateCommentRequestDto } from './dto/request/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  getComments(
    @Req() req: Request,
    @Param() param: ProjectParamsDto,
    @Query() query: CommentQueryDto,
  ) {
    return this.commentService.getComments(req, param, query);
  }

  @Post(':uuid')
  @UseGuards(JwtAuthGuard)
  createComments(
    @Body() payload: CreateCommentRequestDto,
    @Param() param: ProjectParamsDto,
    @Req() req: Request,
  ) {
    return this.commentService.createComments(payload, param, req);
  }

  @Delete(':uuid')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param() param: ProjectParamsDto, @Req() req: Request) {
    return this.commentService.deleteComment(param, req);
  }
}
