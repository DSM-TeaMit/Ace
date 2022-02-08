import { Controller } from '@nestjs/common';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}
}
