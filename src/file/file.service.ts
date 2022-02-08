import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { HeadObjectOutput } from 'aws-sdk/clients/s3';
import { Request } from 'express';
import { extname } from 'path';
import { ProjectParamsDto } from 'src/project/dto/request/project-params.dto';
import { ProjectService } from 'src/project/services/project.service';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { v4 as uuid } from 'uuid';
import { GetImageParamsDto } from './dto/request/get-image.dto';
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

  async getImage(
    param: GetImageParamsDto,
    req: Request,
  ): Promise<StreamableFile> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();

    const s3Path = `${param.uuid}/report/images`;
    if (
      !(await this.isExist(
        param.imageName,
        `${process.env.AWS_S3_BUCKET}/${s3Path}`,
      ))
    )
      throw new NotFoundException();

    const ext = extname(param.imageName).slice(1);
    req.res.set({
      'Content-Type': `image/${ext}; charset=utf-8`,
    });

    return await this.downloadFromS3(
      param.imageName,
      `${process.env.AWS_S3_BUCKET}/${param.uuid}/report/images`,
    );
  }

  async uploadArchive(
    file: Express.MulterS3.File,
    param: ProjectParamsDto,
    req: Request,
  ) {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();

    this.projectService.checkPermission(project, req);

    if (
      await this.isExist(
        'archive_outcomes.zip',
        `${process.env.AWS_S3_BUCKET}/${param.uuid}/report/archive`,
      )
    )
      throw new ConflictException();

    await this.uploadSingleFile({
      file,
      fileName: 'archive_outcomes',
      folder: 'report',
      fileType: 'archive',
      projectUuid: param.uuid,
      allowedExt: /(zip)/,
    });

    return;
  }

  async getArchive(param: ProjectParamsDto, req: Request) {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    if (!project.status.isReportSubmitted) throw new NotFoundException();

    const s3Path = `${param.uuid}/report/archive`;
    const s3Filename = 'archive_outcomes.zip';

    const fileInfo = await this.isExist(
      s3Filename,
      `${process.env.AWS_S3_BUCKET}/${s3Path}`,
    );

    if (!fileInfo) throw new NotFoundException();

    const filename = `[${project.projectType}] ${project.projectName} - ${
      project.writerId.studentNo
    } ${project.writerId.name}${extname(s3Filename)}`;
    req.res.set({
      'Content-Type': 'application/octet-stream; charset=utf-8',
      'Content-Disposition': `'attachment; filename="${encodeURI(filename)}"`,
      'Content-Length': fileInfo.ContentLength,
    });

    return await this.downloadFromS3(
      s3Filename,
      `${process.env.AWS_S3_BUCKET}/${s3Path}`,
    );
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

  async isExist(filename: string, bucket: string): Promise<HeadObjectOutput> {
    const s3 = this.getS3();
    try {
      return await s3.headObject({ Bucket: bucket, Key: filename }).promise();
    } catch (e) {
      if (e.code === 'NotFound') return null;
      else throw new InternalServerErrorException();
    }
  }

  async downloadFromS3(
    filename: string,
    bucket: string,
  ): Promise<StreamableFile> {
    const s3 = this.getS3();
    return new Promise((resolve, reject) => {
      try {
        const stream = s3
          .getObject({ Bucket: bucket, Key: filename })
          .createReadStream();
        resolve(new StreamableFile(stream));
      } catch (e) {
        reject(e);
      }
    });
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
