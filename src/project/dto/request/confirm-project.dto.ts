import { Type } from 'class-transformer';
import { IsBoolean, IsEnum } from 'class-validator';

export class ConfirmProjectQueryDto {
  @IsEnum(['plan', 'report'])
  type: 'plan' | 'report';

  @IsBoolean()
  @Type(() => Boolean)
  value: boolean;
}
