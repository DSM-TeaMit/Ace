import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CreatePlanRequestDto } from '../dto/request/create-plan.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { GetPlanResponseDto } from '../dto/response/get-plan.dto';

@Injectable()
export class PlanService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async createPlan(
    param: ProjectParamsDto,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    if (await this.projectRepository.getPlan(param))
      throw new ConflictException();
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    this.projectRepository.createPlan(project.id, payload);
  }

  async getPlan(param: ProjectParamsDto): Promise<GetPlanResponseDto> {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    return {
      projectName: plan.projectId.projectName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      writer: {
        studentNo: plan.projectId.writerId.studentNo,
        name: plan.projectId.writerId.name,
      },
      members: plan.projectId.members.map((member) => ({
        studentNo: member.userId.studentNo,
        name: member.userId.name,
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
    await this.projectRepository.modifyPlan(project.id, payload);

    return;
  }

  async deletePlan(req: Request, param: ProjectParamsDto) {
    const plan = await this.projectRepository.getPlan(param);
    if (!plan) throw new NotFoundException();
    if (
      !(
        plan.projectId.members
          ?.map((member) => member.userId.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
    this.projectRepository.deletePlan(plan.projectId.id);
    return;
  }
}
