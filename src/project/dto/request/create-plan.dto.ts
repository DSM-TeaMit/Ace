import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreatePlanRequestDto {
  startDate: string;
  endDate: string;
  goal: string;
  content: string;
  includes: Inclusion;
}

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
