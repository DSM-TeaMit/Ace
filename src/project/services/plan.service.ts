import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    req: Request,
    param: ProjectParamsDto,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getPlan(param))
      this.modifyPlan(req, param, payload);
    else this.createPlan(param, payload);
  }

  async createPlan(
    param: ProjectParamsDto,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    await this.projectRepository.createPlan(project.id, payload);
    return;
  }

  async getPlan(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetPlanResponseDto> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    return {
      projectName: plan.project.name,
      projectType: plan.project.type,
      startDate: plan.startDate,
      endDate: plan.endDate,
      requestorType: this.projectService.getRequestorType(plan.project, req),
      status: this.projectService.getDocumentStatus(plan.project, 'plan'),
      writer: {
        studentNo: plan.project.writer.studentNo,
        name: plan.project.writer.name,
      },
      members: plan.project.members.map((member) => ({
        studentNo: member.user.studentNo,
        name: member.user.name,
        role: member.role,
      })),
      goal: plan.goal,
      content: plan.content,
      includes: {
        report: plan.includeResultReport,
        code: plan.includeCode,
        outcome: plan.includeOutcome,
        others: plan.includeOthers,
      },
    };
  }

  async modifyPlan(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyPlanRequestDto,
  ): Promise<void> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    this.projectService.checkPermission(plan.project, req);
    if (
      plan.project.status.isPlanSubmitted ||
      plan.project.status.isPlanAccepted
    )
      throw new ConflictException();

    if (
      !plan.project.status.isPlanSubmitted &&
      !plan.project.status.isPlanAccepted
    )
      await this.projectRepository.setAccepted(plan.project.id, 'plan', null);
    await this.projectRepository.modifyPlan(plan.project.id, payload);

    return;
  }

  async deletePlan(req: Request, param: ProjectParamsDto) {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    if (
      !(
        plan.project.members
          ?.map((member) => member.user.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
    this.projectRepository.deletePlan(plan.project.id);
    return;
  }

  async submitPlan(req: Request, param: ProjectParamsDto): Promise<void> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    this.projectService.checkPermission(plan.project, req);
    const status = plan.project.status;
    if (status.isPlanSubmitted) throw new ConflictException();

    await this.projectRepository.updateSubmitted(plan.project.id, 'plan', true);
  }
}
