import { IsString } from 'class-validator';

export class RegisterAdminRequestDto {
  @IsString()
  id: string;

  @IsString()
  password: string;

  @IsString()
  name: string;
}
