import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanRequestDto } from './create-plan.dto';

export class ModifyPlanRequestDto extends PartialType(CreatePlanRequestDto) {}
