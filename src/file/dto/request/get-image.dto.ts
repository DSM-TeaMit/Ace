import { IsUUID } from 'class-validator';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';

export class GetImageParamsDto extends ProjectParamsDto {
  @IsUUID('4')
  imageName: string;
}
