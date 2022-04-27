export interface UploadFileOptions {
  file?: Express.MulterS3.File;
  files?: Express.MulterS3.File[];
  fileName?: string;
  fileType: 'pdf' | 'video' | 'image' | 'archive' | 'excel';
  folder?: string;
  projectUuid?: string;
  allowedExt: RegExp;
}
