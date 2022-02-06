import { Type } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { IsStudentNo } from 'src/shared/decorators/is-student-no.decorator';

export class RegisterUserRequestDto {
  @IsStudentNo()
  @Type(() => Number)
  studentNo: number;

  @IsString()
  @Length(2, 6)
  name: string;

  @IsString()
  @Length(0, 20)
  @IsOptional()
  githubId?: string;
}
