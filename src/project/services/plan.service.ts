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
    return {
      projectName: plan.projectId.projectName,
      startDate: plan.startDate,
      endDate: plan.endDate,
      writerId: plan.projectId.writerId.uuid,
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
}
