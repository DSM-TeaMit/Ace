import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
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
    param: ProjectParamsDto,
    payload: CreateReportRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getReport(param))
      this.modifyReport(param, payload);
    else if (
      (await this.projectRepository.findOne(param)).status.isPlanAccepted
    )
      this.createReport(param, payload);
    else throw new WsException('Conflict');
  }

  async createReport(
    param: ProjectParamsDto,
    payload: CreateReportRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new WsException('Not Found');
    this.projectRepository.createReport(project.id, payload);
  }

  async getReport(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetReportResponseDto> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    const requestorType = this.projectService.getRequestorType(
      report.project,
      req,
    );
    return new GetReportResponseDto(report, requestorType);
  }

  async modifyReport(
    param: ProjectParamsDto,
    payload: ModifyReportRequestDto,
  ): Promise<void> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new WsException('Not Found');
    if (
      report.project.status.isReportSubmitted ||
      report.project.status.isReportAccepted
    )
      throw new WsException('Conflict');

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
  }

  async deleteReport(req: Request, param: ProjectParamsDto): Promise<void> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.project, req.user.userId);
    this.projectRepository.deleteReport(report.project.id);
  }

  async submitReport(req: Request, param: ProjectParamsDto): Promise<void> {
    const report = await this.projectRepository.getReport(param);
    if (!report) throw new NotFoundException();
    this.projectService.checkPermission(report.project, req.user.userId);
    const status = report.project.status;
    if (status.isReportSubmitted) throw new ConflictException();

    await this.projectRepository.updateSubmitted(
      report.project.id,
      'report',
      true,
    );
  }
}
