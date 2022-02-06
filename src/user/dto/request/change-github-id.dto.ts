import { IsString, Length } from 'class-validator';

export class ChangeGithubIdRequestDto {
  @IsString()
  @Length(1, 20)
  githubId: string;
}
