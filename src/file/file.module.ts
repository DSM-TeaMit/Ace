import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectModule } from 'src/project/project.module';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectRepository]), ProjectModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
