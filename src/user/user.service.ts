import {
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
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { Project } from 'src/shared/entities/project/project.entity';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { ChangeGithubIdRequestDto } from './dto/request/change-github-id.dto';
import {
  ProfileEachReportRequestQueryDto,
  ProfileRequestDto,
  ProfileRequestQueryDto,
} from './dto/request/profile.dto';
import { RegisterUserRequestDto } from './dto/request/register-user.dto';
import { SearchUserRequestQueryDto } from './dto/request/search-user.dto';
import { HeaderInfoResponseDto } from './dto/response/header-info.dto';
import { ProfileMainResponseDto } from './dto/response/profile-main.dto';
import { ProfileProjectsDto } from './dto/response/profile-projects.dto';
import { ProfileReportsDto } from './dto/response/profile-reports.dto';
import { SearchUserDto } from './dto/response/search-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly adminRepository: AdminRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly userRepository: UserRepository,
  ) {}

  async register(req: Request, payload: RegisterUserRequestDto) {
    if (payload.githubId) {
      const cache = await this.cacheManager.get<string>(req.user.email);
      if (!cache) throw new UnprocessableEntityException();
      if (cache !== payload.githubId) throw new ConflictException();
      await this.cacheManager.del(req.user.email);
    }
    if (await this.userRepository.findOne(req.user.email))
      throw new ConflictException();
    await this.userRepository.insert({
      ...payload,
      email: req.user.email,
      thumbnailUrl: req.user.picture,
    });
    return;
  }

  async getHeaderInfo(req: Request): Promise<HeaderInfoResponseDto> {
    const user =
      req.user.role === 'user'
        ? await this.userRepository.findOneByUuid(req.user.userId)
        : undefined;
    const admin =
      req.user.role === 'admin'
        ? await this.adminRepository.findOne({ uuid: req.user.userId })
        : undefined;
    return {
      thumbnailUrl: user?.thumbnailUrl ?? undefined,
      emoji: admin?.thumbnailUrl,
      studentNo: user?.studentNo,
      name: user?.name ?? admin?.name,
      type: req.user.role,
    };
  }

  async getProfile(
    req: Request,
    payload: ProfileRequestDto,
  ): Promise<ProfileMainResponseDto> {
    const uuid = payload.uuid ?? req.user.userId;
    const isMine = !payload.uuid || payload.uuid === req.user.userId;
    const user = await this.userRepository.findOneByUuid(uuid);
    if (!user) throw new NotFoundException();

    const projects = await this.userRepository.getProjectsOfUser(
      user.id,
      isMine,
      1,
      4,
    );

    const pendingProjects = isMine
      ? (
          (
            await this.userRepository.getPendingProjects(user.id)
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
                if (project.status.isReportAccepted === false)
                  return 'DECLINED';
                else return 'PENDING';
            }
          })();
          return {
            uuid: project.uuid,
            projectName: project.projectName,
            thumbnailUrl: project.thumbnailUrl,
            emoji: project.emoji,
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
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
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
    if (!user) throw new NotFoundException();

    const projects = await this.userRepository.getProjectsOfUser(
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
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
        members: project.members.map((member) => ({
          uuid: member.userId.uuid,
          name: member.userId.name,
          thumbnailUrl: member.userId.thumbnailUrl,
        })),
      })),
    };
  }

  async getReports(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileRequestQueryDto,
  ): Promise<ProfileReportsDto> {
    const uuid = param.uuid ?? req.user.userId;
    const isMine = !param.uuid || param.uuid === req.user.userId;
    if (!isMine) throw new ForbiddenException();
    const user = await this.userRepository.findOneByUuid(uuid);

    const projects = (
      await Promise.all([
        this.userRepository.getReports(
          user.id,
          query.page,
          query.limit,
          true,
          true,
        ),
        this.userRepository.getReports(
          user.id,
          query.page,
          query.limit,
          false,
          false,
        ),
        this.userRepository.getReports(
          user.id,
          query.page,
          query.limit,
          true,
          null,
        ),
        this.userRepository.getReports(
          user.id,
          query.page,
          query.limit,
          false,
          null,
        ),
      ])
    ).map((res) => ({
      count: res[1],
      projects: res[0].map((project) => {
        return {
          uuid: project.uuid,
          projectName: project.projectname,
          thumbnailUrl: project.thumbnailurl,
          emoji: project.emoji,
          type: project.type,
        };
      }),
    }));

    return {
      accepted: projects[0],
      rejected: projects[1],
      pending: projects[2],
      writing: projects[3],
    };
  }

  async getEachReports(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileEachReportRequestQueryDto,
  ): Promise<Partial<ProfileReportsDto>> {
    const uuid = param.uuid ?? req.user.userId;
    const isMine = !param.uuid || param.uuid === req.user.userId;
    if (!isMine) throw new ForbiddenException();
    const user = await this.userRepository.findOneByUuid(uuid);

    const projects = await this.userRepository.getReports(
      user.id,
      query.page,
      query.limit,
      { accepted: true, rejected: false, pending: true, writing: false }[
        query.type
      ],
      { accepted: true, rejected: false, pending: null, writing: null }[
        query.type
      ],
    );

    return {
      [query.type]: {
        count: projects[1],
        projects: projects[0].map((project) => {
          return {
            uuid: project.uuid,
            projectName: project.projectname,
            thumbnailUrl: project.thumbnailurl,
            emoji: project.emoji,
            type: project.type,
          };
        }),
      },
    };
  }

  async changeGithubId(
    req: Request,
    payload: ChangeGithubIdRequestDto,
  ): Promise<void> {
    const user = await this.userRepository.findOneByUuid(req.user.userId);
    const cache = await this.cacheManager.get<string>(user.email);
    if (!cache) throw new UnprocessableEntityException();
    if (cache !== payload.githubId) throw new ConflictException();
    await this.cacheManager.del(user.email);

    await this.userRepository.updateGithubId(user.id, payload.githubId);
    return;
  }

  async deleteUser(req: Request): Promise<void> {
    await this.userRepository.deleteUser(req.user.userId);
    return;
  }

  async searchUser(query: SearchUserRequestQueryDto): Promise<SearchUserDto> {
    return {
      students: (await this.userRepository.searchUser(query)).map((user) => ({
        uuid: user.uuid,
        studentNo: user.studentNo,
        name: user.name,
      })),
    };
  }
}
