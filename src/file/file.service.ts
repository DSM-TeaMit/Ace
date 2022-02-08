import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { Request } from 'express';
import { extname } from 'path';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { ProjectService } from 'src/project/services/project.service';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { v4 as uuid } from 'uuid';
import { UploadFileOptions } from './interfaces/uploadFileOptions.interface';

@Injectable()
export class FileService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectService: ProjectService,
  ) {}
  async uploadImage(
    file: Express.MulterS3.File,
    param: ProjectParamsDto,
    req: Request,
  ): Promise<string> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    this.projectService.checkPermission(project, req);
    const uploadedUrl = await this.uploadSingleFile({
      file,
      folder: 'report',
      fileType: 'images',
      projectUuid: param.uuid,
      allowedExt: /(jpg)|(png)|(jpeg)|(bmp)/,
    });
    return uploadedUrl;
  }

  async uploadSingleFile(options: UploadFileOptions): Promise<string> {
    const ext = extname(options.file.originalname).toLowerCase();
    const regex = options.allowedExt;
    if (!regex.test(ext)) {
      throw new BadRequestException(
        `This file extension(${ext}) is not supported.`,
      );
    }

    const bucketS3 = process.env.AWS_S3_BUCKET;
    const filename = options.fileName ?? uuid();
    const location = `${options.projectUuid}/${options.folder}/${options.fileType}/${filename}${ext}`;
    try {
      await this.uploadToS3(
        options.file.buffer,
        `${bucketS3}/${options.projectUuid}/${options.folder}/${options.fileType}`,
        filename + ext,
      );
    } catch {
      throw new InternalServerErrorException();
    }
    return location;
  }

  async uploadToS3(file, bucket, name) {
    const s3 = this.getS3();
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }
}
