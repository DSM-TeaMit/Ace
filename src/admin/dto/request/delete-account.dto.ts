import { IsUUID } from 'class-validator';

export class DeleteAccountParamsDto {
  @IsUUID('4')
  uuid: string;
}
