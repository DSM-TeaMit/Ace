import { IsUUID } from 'class-validator';

export class ProjectParamsDto {
  @IsUUID('4')
  uuid: string;
}
