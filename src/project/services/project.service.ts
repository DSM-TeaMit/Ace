import {
  BadRequestException,
  CACHE_MANAGER,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Project } from 'src/shared/entities/project/project.entity';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { Status } from 'src/shared/entities/status/status.entity';
import { User } from 'src/shared/entities/user/user.entity';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { ConfirmProjectQueryDto } from '../dto/request/confirm-project.dto';
import { CreateProjectRequestDto } from '../dto/request/create-project.dto';
import {
  ModifyMemberRequestDto,
  ModifyProjectRequestDto,
} from '../dto/request/modify-project.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { CreateProjectResponseDto } from '../dto/response/create-project.dto';
import { GetProjectResponseDto } from '../dto/response/get-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createProject(
    req: Request,
    payload: CreateProjectRequestDto,
  ): Promise<CreateProjectResponseDto> {
    if (payload.members.map((member) => member.uuid).includes(req.user.userId))
      throw new UnprocessableEntityException();
    if (payload.type === 'PERS' && payload.members.length > 0)
      throw new BadRequestException();
    if (payload.type !== 'PERS' && payload.members.length < 1)
      throw new BadRequestException();
    const members: {
      id: number;
      role: string;
    }[] = [];
    const writerId = (await this.userRepository.findOneByUuid(req.user.userId))
      .id;
    for await (const member of payload.members) {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new NotFoundException();
      members.push({
        id: user.id,
        role: member.role,
      });
    }
    members.push({ id: writerId, role: payload.role });

    return {
      uuid: await this.projectRepository.createProject(
        payload,
        members,
        writerId,
      ),
    };
  }

  async getProject(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetProjectResponseDto> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    if (!(await this.cacheManager.get(req.user.userId))) {
      await this.projectRepository.increaseViewCount(
        project.id,
        project.viewCount,
      );
      await this.cacheManager.set(req.user.userId, 'VIEWCOUNT_CACHE');
    }
    const status = this.mapProjectStatus(project.status);
    return {
      uuid: project.uuid,
      projectName: project.name,
      projectDescription: project.description,
      projectView: project.viewCount,
      projectType: project.type,
      projectField: project.field,
      projectStatus: status,
      projectResult: project.result,
      thumbnailUrl: project.thumbnailUrl,
      emoji: project.emoji,
      requestorType: this.getRequestorType(project, req),
      members: project.members.map((member) => ({
        uuid: member.user.uuid,
        studentNo: member.user.studentNo,
        name: member.user.name,
        role: member.role,
        thumbnailUrl: member.user.thumbnailUrl,
      })),
    };
  }

  mapProjectStatus(status: Status) {
    if (!status.isPlanSubmitted) return 'PLANNING';
    if (status.isPlanSubmitted && status.isPlanAccepted === null)
      return 'PENDING(PLAN)';
    if (status.isPlanAccepted && !status.isReportSubmitted) return 'REPORTING';
    if (status.isReportSubmitted && status.isReportAccepted === null)
      return 'PENDING(REPORT)';
    if (status.isReportAccepted) return 'DONE';
  }

  async modifyProject(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyProjectRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    this.checkPermission(project, req);
    await this.projectRepository.modifyProject(project.id, payload);

    return;
  }

  async modifyMember(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyMemberRequestDto,
  ): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    if (project.type === 'PERS' && payload.members.length > 0)
      throw new BadRequestException();
    if (project.type !== 'PERS' && payload.members.length < 1)
      throw new BadRequestException();
    this.checkPermission(project, req);
    if (
      !(
        payload.members
          ?.map((member) => member.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new UnprocessableEntityException();
    const members: {
      id: number;
      role: string;
    }[] = [];
    const writerId = (await this.userRepository.findOneByUuid(req.user.userId))
      .id;
    for await (const member of payload.members) {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new NotFoundException();
      members.push({
        id: user.id,
        role: member.role,
      });
    }
    members.push({ id: writerId, role: payload.role });
    if (!(await this.projectRepository.modifyMember(project.id, members)))
      throw new InternalServerErrorException();

    return;
  }

  async deleteProject(req: Request, param: ProjectParamsDto): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    if (
      !(
        project.members
          ?.map((member) => member.user.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();

    await this.projectRepository.deleteProject(param.uuid);

    return;
  }

  async confirmProject(
    req: Request,
    param: ProjectParamsDto,
    query: ConfirmProjectQueryDto,
  ) {
    let projectId = undefined;
    switch (query.type) {
      case 'plan':
        const plan = await this.projectRepository.getPlan(param);
        if (!plan) throw new NotFoundException();
        if (
          !plan.project.status.isPlanSubmitted ||
          plan.project.status.isPlanAccepted
        )
          throw new ConflictException();
        projectId = plan.project.id;
        break;
      case 'report':
        const report = await this.projectRepository.getReport(param);
        if (!report) throw new NotFoundException();
        if (
          !report.project.status.isReportSubmitted ||
          report.project.status.isReportAccepted
        )
          throw new ConflictException();
        projectId = report.project.id;
        break;
    }

    this.projectRepository.updateConfirmed(projectId, query.type, query.value);
  }

  getRequestorType(project: Project, req: Request) {
    if (req.user.role === 'admin') return 'ADMIN';
    else {
      try {
        this.checkPermission(project, req);
        return 'USER_EDITABLE';
      } catch {
        return 'USER_NON_EDITABLE';
      }
    }
  }

  checkPermission(project: Project, req: Request) {
    if (
      !(
        project.members
          ?.map((member) => member.user.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
  }

  getDocumentStatus(project: Project, type: 'plan' | 'report') {
    if (type === 'plan') {
      if (
        !project.status.isPlanSubmitted &&
        project.status.isPlanAccepted === null
      )
        return 'NOT_SUBMITTED';
      if (
        project.status.isPlanSubmitted &&
        project.status.isPlanAccepted === null
      )
        return 'PENDING';
      if (project.status.isPlanAccepted) return 'ACCEPTED';
      if (!project.status.isPlanSubmitted && !project.status.isPlanAccepted)
        return 'REJECTED';
    }
    if (type === 'report') {
      if (
        !project.status.isReportSubmitted &&
        project.status.isReportAccepted === null
      )
        return 'NOT_SUBMITTED';
      if (
        project.status.isReportSubmitted &&
        project.status.isReportAccepted === null
      )
        return 'PENDING';
      if (project.status.isReportAccepted) return 'ACCEPTED';
      if (!project.status.isReportSubmitted && !project.status.isReportAccepted)
        return 'REJECTED';
    }
  }
}
