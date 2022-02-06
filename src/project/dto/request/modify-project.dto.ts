import { PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateProjectRequestDto } from './create-project.dto';

export class ModifyProjectRequestDto extends PartialType(
  CreateProjectRequestDto,
) {}

export class ModifyProjectParamsDto {
  @IsUUID('4')
  uuid: string;
}
