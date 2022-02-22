import { IsString } from 'class-validator';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';

export class GetImageParamsDto extends ProjectParamsDto {
  @IsString()
  imageName: string;
}
