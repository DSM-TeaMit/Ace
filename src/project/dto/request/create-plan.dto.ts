import { Type } from 'class-transformer';
import {
  IsBoolean,
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
  @IsString()
  @Length(10)
  startDate: string;

  @IsString()
  @Length(10)
  endDate: string;

  @IsString()
  @Length(10)
  goal: string;

  @IsString()
  @Length(10)
  content: string;

  @ValidateNested()
  @Type(() => Inclusion)
  includes: Inclusion;
}
