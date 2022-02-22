export interface UploadFileOptions {
  file?: Express.MulterS3.File;
  files?: Express.MulterS3.File[];
  fileName?: string;
  fileType: 'pdf' | 'video' | 'image' | 'archive';
  folder?: string;
  projectUuid: string;
  allowedExt: RegExp;
}
