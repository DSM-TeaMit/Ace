import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

class Inclusion {
  @IsBoolean()
  report: boolean;

  @IsBoolean()
  code: boolean;

  @IsBoolean()
  outcome: boolean;

  @IsString()
  @Length(1, 15)
  @IsOptional()
  others?: string;
}

export class CreatePlanRequestDto {
  @IsDateString()
  @Length(10, 10)
  startDate: string;

  @IsDateString()
  @Length(10, 10)
  endDate: string;

  @IsString()
  @Length(0, 4000)
  goal: string;

  @IsString()
  @Length(0, 10000)
  content: string;

  @ValidateNested()
  @Type(() => Inclusion)
  includes: Inclusion;
}
