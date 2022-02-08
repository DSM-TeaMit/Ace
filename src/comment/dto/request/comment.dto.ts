import { IsEnum } from 'class-validator';

export class CommentQueryDto {
  @IsEnum(['project', 'plan', 'report'])
  type: 'project' | 'plan' | 'report';
}
