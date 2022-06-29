import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Request } from 'express';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CreatePlanRequestDto } from '../dto/request/create-plan.dto';
import { ModifyPlanRequestDto } from '../dto/request/modify-plan.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { GetPlanResponseDto } from '../dto/response/get-plan.dto';
import { ProjectService } from './project.service';

@Injectable()
export class PlanService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectService: ProjectService,
  ) {}

  async createOrModifyPlan(
    param: ProjectParamsDto,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getPlan(param))
      this.modifyPlan(param, payload);
    else this.createPlan(param, payload);
  }

  async createPlan(
    param: ProjectParamsDto,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    await this.projectRepository.createPlan(project.id, payload);
  }

  async getPlan(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetPlanResponseDto> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    return new GetPlanResponseDto(
      plan,
      this.projectService.getRequestorType(plan.project, req),
      this.projectService.getDocumentStatus(plan.project, 'plan'),
    );
  }

  async modifyPlan(
    param: ProjectParamsDto,
    payload: ModifyPlanRequestDto,
  ): Promise<void> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new WsException('Not Found');
    if (
      plan.project.status.isPlanSubmitted ||
      plan.project.status.isPlanAccepted
    )
      throw new WsException('Conflict');

    if (
      !plan.project.status.isPlanSubmitted &&
      !plan.project.status.isPlanAccepted
    )
      await this.projectRepository.setAccepted(plan.project.id, 'plan', null);
    await this.projectRepository.modifyPlan(plan.project.id, payload);
  }

  async deletePlan(req: Request, param: ProjectParamsDto): Promise<void> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    this.projectService.checkPermission(plan.project, req.user.userId);
    this.projectRepository.deletePlan(plan.project.id);
  }

  async submitPlan(req: Request, param: ProjectParamsDto): Promise<void> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    this.projectService.checkPermission(plan.project, req.user.userId);
    const status = plan.project.status;
    if (status.isPlanSubmitted) throw new ConflictException();

    await this.projectRepository.updateSubmitted(plan.project.id, 'plan', true);
  }
}
