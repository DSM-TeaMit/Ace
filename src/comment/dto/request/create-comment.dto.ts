import { IsEnum, IsString, Length } from 'class-validator';

export class CreateCommentRequestDto {
  @IsString()
  @Length(1, 200)
  content: string;

  @IsEnum(['project', 'plan', 'report'])
  type: 'project' | 'plan' | 'report';
}
