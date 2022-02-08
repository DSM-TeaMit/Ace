import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { Role } from '../shared/enums/role.enum';
import { GetImageParamsDto } from './dto/request/get-image.dto';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post(':projectId/image')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  uploadImages(
    @UploadedFile() file: Express.MulterS3.File,
    @Param() param: ProjectParamsDto,
    @Req() req: Request,
  ) {
    return this.fileService.uploadImage(file, param, req);
  }

  @Get(':projectId/image/:imageName')
  @UseGuards(JwtAuthGuard)
  getImage(@Param() param: GetImageParamsDto, @Req() req: Request) {
    return this.fileService.getImage(param, req);
  }

  @Post(':projectId/archive')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('archive'))
  uploadArchive(
    @UploadedFile() file: Express.MulterS3.File,
    @Param() param: ProjectParamsDto,
    @Req() req: Request,
  ) {
    return this.fileService.uploadArchive(file, param, req);
  }

  @Get(':projectId/archive')
  @UseGuards(JwtAuthGuard)
  getArchive(@Param() param: ProjectParamsDto, @Req() req: Request) {
    return this.fileService.getArchive(param, req);
  }
}
