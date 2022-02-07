import { PartialType } from '@nestjs/mapped-types';
import { CreateReportRequestDto } from './create-report.dto';

export class ModifyReportRequestDto extends PartialType(
  CreateReportRequestDto,
) {}
