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
import { ProjectService } from './project.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectService: ProjectService,
  ) {}

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
      projectType: report.projectId.projectType,
      subject: report.subject,
      writer: {
        studentNo: report.projectId.writerId.studentNo,
        name: report.projectId.writerId.name,
      },
      content: report.content,
    };
  }

  async modifyReport(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyReportRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    if (
      !(
        project.members
          ?.map((member) => member.userId.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
    await this.projectRepository.modifyReport(project.id, payload);

    return;
  }

  async deleteReport(req: Request, param: ProjectParamsDto) {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    if (
      !(
        report.projectId.members
          ?.map((member) => member.userId.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
    this.projectRepository.deleteReport(report.projectId.id);
    return;
  }

  async submitReport(req: Request, param: ProjectParamsDto) {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.projectId, req);
    const status = report.projectId.status;
    if (status.isReportSubmitted) throw new ConflictException();

    await this.projectRepository.updateSubmitted(
      report.projectId.id,
      'report',
      true,
    );
  }
}
