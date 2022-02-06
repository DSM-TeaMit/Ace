import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectRequestDto } from './create-project.dto';

export class ModifyProjectRequestDto extends PartialType(
  CreateProjectRequestDto,
) {}
