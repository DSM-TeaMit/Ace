import { IsString, Length } from 'class-validator';

export class CreateReportRequestDto {
  @IsString()
  @Length(0, 40)
  subject: string;

  @IsString()
  @Length(1, 15000)
  content: string;
}
