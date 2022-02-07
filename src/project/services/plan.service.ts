import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { CreatePlanRequestDto } from '../dto/request/create-plan.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';

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
}
