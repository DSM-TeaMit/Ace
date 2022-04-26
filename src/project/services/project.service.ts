import {
  BadRequestException,
  CACHE_MANAGER,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Member } from 'src/shared/entities/member/member.entity';
import { Project } from 'src/shared/entities/project/project.entity';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { Status } from 'src/shared/entities/status/status.entity';
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
    this.checkUserInMembers(payload.members, req);
    this.checkMemberLength(payload.type, payload.members);

    const members = await this.mapMembersToEntityArray(payload, req);
    return {
      uuid: await this.projectRepository.createProject(
        payload,
        members,
        members[members.length - 1].user,
      ),
    };
  }

  async getProject(
    req: Request,
    param: ProjectParamsDto,
  ): Promise<GetProjectResponseDto> {
    const project = await this.projectRepository.findOne(param);
    if (!project) throw new NotFoundException();
    const plan = await this.projectRepository.getPlan(param);
    const report = await this.projectRepository.getReport(param);
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
      members: this.sortProjectMembers(project.members, req.user.userId).map(
        (member) => ({
          uuid: member.user.uuid,
          studentNo: member.studentNo,
          name: member.user.name,
          role: member.role,
          thumbnailUrl: member.user.thumbnailUrl,
        }),
      ),
      plan: plan
        ? {
            uuid: project.uuid,
            projectName: project.name,
            type: 'plan',
            status: this.getDocumentStatus(project, 'plan'),
            thumbnailUrl: project.thumbnailUrl,
            emoji: project.emoji,
          }
        : undefined,
      report: report
        ? {
            uuid: project.uuid,
            projectName: project.name,
            type: 'report',
            status: this.getDocumentStatus(project, 'report'),
            thumbnailUrl: project.thumbnailUrl,
            emoji: project.emoji,
          }
        : undefined,
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

  sortProjectMembers(members: Member[], userId: string): Member[] {
    const sortedMembers = [...members];
    sortedMembers.sort((a, b) => a.studentNo - b.studentNo);
    const index = members.findIndex((member) => member.user.uuid === userId);
    if (index > -1) {
      const user = members[index];
      sortedMembers.splice(index, 1);
      sortedMembers.unshift(user);
    }
    return sortedMembers;
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
    this.checkMemberLength(project.type, payload.members);
    this.checkPermission(project, req);
    this.checkUserInMembers(payload.members, req);

    const members = await this.mapMembersToEntityArray(payload, req);
    await this.projectRepository.modifyMember(project.id, members);

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

  checkUserInMembers(members: { uuid: string; role: string }[], req: Request) {
    if (members.map((member) => member.uuid).includes(req.user.userId))
      throw new UnprocessableEntityException();
  }

  checkMemberLength(type: string, members: { uuid: string; role: string }[]) {
    if (
      (type === 'PERS' && members.length > 0) ||
      (type !== 'PERS' && members.length < 1)
    )
      throw new BadRequestException();
  }

  async mapMembersToEntityArray(
    payload: { role: string; members: { uuid: string; role: string }[] },
    req: Request,
  ): Promise<Partial<Member>[]> {
    const members = payload.members.map(async (member) => {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new NotFoundException();
      return {
        user,
        role: member.role,
        studentNo: user.studentNo,
      };
    });

    members.push(
      (async () => {
        const writer = await this.userRepository.findOneByUuid(req.user.userId);
        return {
          user: writer,
          role: payload.role,
          studentNo: writer.studentNo,
        };
      })(),
    );
    return await Promise.all(members);
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
