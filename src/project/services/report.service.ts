import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CreateReportRequestDto } from '../dto/request/create-report.dto';
import { ModifyReportRequestDto } from '../dto/request/modify-report.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { GetReportResponseDto } from '../dto/response/get-report.dto';

@Injectable()
export class ReportService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async createReport(
    param: ProjectParamsDto,
    payload: CreateReportRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getReport(param))
      throw new ConflictException();
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    this.projectRepository.createReport(project.id, payload);
  }

  async getReport(param: ProjectParamsDto): Promise<GetReportResponseDto> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    return {
      subject: report.subject,
      writer: {
        studentNo: report.projectId.writerId.studentNo,
        name: report.projectId.writerId.name,
      },
      content: report.content,
    };
  }

}
