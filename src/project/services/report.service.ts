import {
  ConflictException,
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

  async createOrModifyReport(
    req: Request,
    param: ProjectParamsDto,
    payload: CreateReportRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getReport(param))
      this.modifyReport(req, param, payload);
    else if (
      (await this.projectRepository.findOne(param)).status.isPlanAccepted
    )
      this.createReport(param, payload);
    else throw new ConflictException();
  }

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

  async getReport(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetReportResponseDto> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    return {
      projectName: report.project.name,
      projectType: report.project.type,
      requestorType: this.projectService.getRequestorType(report.project, req),
      status: this.projectService.getDocumentStatus(report.project, 'report'),
      subject: report.subject,
      writer: {
        studentNo: report.project.writer.studentNo,
        name: report.project.writer.name,
      },
      content: report.content,
    };
  }

  async modifyReport(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyReportRequestDto,
  ): Promise<void> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.project, req);
    if (
      report.project.status.isReportSubmitted ||
      report.project.status.isReportAccepted
    )
      throw new ConflictException();

    if (
      !report.project.status.isReportSubmitted &&
      !report.project.status.isReportAccepted
    )
      await this.projectRepository.setAccepted(
        report.project.id,
        'report',
        null,
      );
    await this.projectRepository.modifyReport(report.project.id, payload);

    return;
  }

  async deleteReport(req: Request, param: ProjectParamsDto) {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.project, req);
    this.projectRepository.deleteReport(report.project.id);
    return;
  }

  async submitReport(req: Request, param: ProjectParamsDto) {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.project, req);
    const status = report.project.status;
    if (status.isReportSubmitted) throw new ConflictException();

    await this.projectRepository.updateSubmitted(
      report.project.id,
      'report',
      true,
    );
  }
}
