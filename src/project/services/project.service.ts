import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentRepository } from 'src/shared/entities/comment/comment.repository';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { CreateProjectRequestDto } from '../dto/request/create-project.dto';
import { ModifyProjectRequestDto } from '../dto/request/modify-project.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { CreateProjectResponseDto } from '../dto/response/create-project.dto';
import { GetProjectResponseDto } from '../dto/response/get-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createProject(
    req: Request,
    payload: CreateProjectRequestDto,
  ): Promise<CreateProjectResponseDto> {
    if (!payload.members.map((member) => member.uuid).includes(req.user.userId))
      throw new ForbiddenException();
    const members: {
      id: number;
      role: string;
    }[] = [];
    for await (const member of payload.members) {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new UnprocessableEntityException();
      members.push({
        id: user.id,
        role: member.role,
      });
    }

    return {
      uuid: await this.projectRepository.createProject(payload, members),
    };
  }

  async getProject(param: ProjectParamsDto): Promise<GetProjectResponseDto> {
    const project = await this.projectRepository.findOne(param);
    const comments = await this.commentRepository.findMany(
      project.id,
      'PROJECT',
    );
    const status = (() => {
      if (
        !project.status.isPlanSubmitted ||
        (project.status.isPlanSubmitted &&
          project.status.isPlanAccepted === false)
      )
        return 'PLANNING';
      if (
        project.status.isPlanSubmitted &&
        project.status.isPlanAccepted === null
      )
        return 'PENDING(PLAN)';
      if (
        (project.status.isPlanAccepted && !project.status.isReportSubmitted) ||
        (project.status.isReportSubmitted &&
          project.status.isReportAccepted === false)
      )
        return 'REPORTING';
      if (
        project.status.isReportSubmitted &&
        project.status.isReportAccepted === null
      )
        return 'PENDING(REPORT)';
      if (project.status.isReportAccepted) return 'DONE';
    })();
    return {
      uuid: project.uuid,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      projectView: project.viewCount,
      projectType: project.projectType,
      projectField: project.field,
      projectStatus: status,
      projectResult: project.projectResult,
      comments: comments[0].map((comment) => ({
        userUuid: comment.adminId?.uuid ?? comment.userId?.uuid,
        thumbnailUrl:
          comment.adminId?.thumbnailUrl ?? comment.userId?.thumbnailUrl,
        content: comment.content,
      })),
      members: project.members.map((member) => ({
        uuid: member.userId.uuid,
        studentNo: member.userId.studentNo,
        name: member.userId.name,
        role: member.role,
        thumbnailUrl: member.userId.thumbnailUrl,
      })),
    };
  }

  async modifyProject(
    req: Request,
    param: ProjectParamsDto,
    payload: ModifyProjectRequestDto,
  ): Promise<void> {
    if (
      !(
        payload.members
          ?.map((member) => member.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();
    const members: {
      id: number;
      role: string;
    }[] = [];
    for await (const member of payload.members) {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new UnprocessableEntityException();
      members.push({
        id: user.id,
        role: member.role,
      });
    }

    await this.projectRepository.modifyProject(param.uuid, payload, members);

    return;
  }

  async deleteProject(req: Request, param: ProjectParamsDto): Promise<void> {
    const project = await this.projectRepository.findOne(param);
    if (
      !(
        project.members
          ?.map((member) => member.userId.uuid)
          .includes(req.user.userId) ?? true
      )
    )
      throw new ForbiddenException();

    await this.projectRepository.deleteProject(param.uuid);

    return;
  }
}