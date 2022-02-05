import {
  CACHE_MANAGER,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Project } from 'src/shared/entities/project/project.entity';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import {
  ProfileRequestDto,
  ProfileRequestQueryDto,
} from './dto/request/profile.dto';
import { RegisterUserRequestDto } from './dto/request/register-user.dto';
import { ProfileMainResponseDto } from './dto/response/profile-main.dto';
import { ProfileProjectsDto } from './dto/response/profile-projects.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async register(req: Request, payload: RegisterUserRequestDto) {
    if (payload.githubId) {
      if (await this.cacheManager.get(req.user.email))
        throw new NotFoundException();
      await this.cacheManager.del(req.user.email);
    }
    if (await this.userRepository.findOne(req.user.email))
      throw new ConflictException();
    await this.userRepository.insert({
      ...payload,
      email: req.user.email,
    });
    return;
  }

  async getProfile(
    req: Request,
    payload: ProfileRequestDto,
  ): Promise<ProfileMainResponseDto> {
    const uuid = payload.uuid ?? req.user.userId;
    const isMine = !payload.uuid || payload.uuid === req.user.userId;
    const user = await this.userRepository.findOneByUuid(uuid);

    const projects = await this.projectRepository.getProjectsOfUser(
      user.id,
      isMine,
      1,
      4,
    );

    const pendingProjects = isMine
      ? (
          (
            await this.projectRepository.getPendingProjects(user.id)
          )[0] as Project[]
        )?.map((project) => {
          const type =
            project.status.isPlanSubmitted && !project.status.isPlanAccepted
              ? 'PLAN'
              : 'REPORT';
          const status = (() => {
            switch (type) {
              case 'PLAN':
                if (project.status.isPlanAccepted === false) return 'DECLINED';
                else return 'PENDING';
              case 'REPORT':
                if (project.status.isPlanAccepted === false) return 'DECLINED';
                else return 'PENDING';
            }
          })();
          return {
            uuid: project.uuid,
            projectName: project.projectName,
            type,
            status,
          };
        })
      : undefined;

    return {
      studentNo: user.studentNo,
      name: user.name,
      email: user.email,
      githubId: user.githubId,
      pendingCount: pendingProjects?.length,
      pendingProjects: pendingProjects,
      projectCount: projects[1],
      projects: projects[0].map((project) => ({
        uuid: project.uuid,
        projectName: project.projectName,
        projectDescription: project.projectDescription,
        projectType: project.projectType,
        fields: project.field,
        members: project.members.map((member) => ({
          uuid: member.userId.uuid,
          name: member.userId.name,
          thumbnailUrl: member.userId.thumbnailUrl,
        })),
      })),
    };
  }

  async getProjects(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileRequestQueryDto,
  ): Promise<ProfileProjectsDto> {
    const uuid = param.uuid ?? req.user.userId;
    const isMine = !param.uuid || param.uuid === req.user.userId;
    const user = await this.userRepository.findOneByUuid(uuid);

    const projects = await this.projectRepository.getProjectsOfUser(
      user.id,
      isMine,
      query.page,
      query.limit,
    );

    return {
      count: projects[1],
      projects: projects[0].map((project) => ({
        uuid: project.uuid,
        projectName: project.projectName,
        projectDescription: project.projectDescription,
        projectType: project.projectType,
        fields: project.field,
        members: project.members.map((member) => ({
          uuid: member.userId.uuid,
          name: member.userId.name,
          thumbnailUrl: member.userId.thumbnailUrl,
        })),
      })),
    };
  }
}
