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
import { ExcelService } from 'src/excel/excel.service';
import { FileService } from 'src/file/file.service';
import { ProjectService } from 'src/project/services/project.service';
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
    private readonly excelService: ExcelService,
    private readonly fileService: FileService,
    private readonly projectService: ProjectService,
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

  async migrateUsers(file: Express.MulterS3.File) {
    const fileName = new Date()
      .toLocaleDateString()
      .replace(/(\s*)/g, '')
      .slice(0, -1);
    await this.fileService.uploadSingleFile({
      file,
      fileName,
      fileType: 'excel',
      allowedExt: /(xlsx)/,
    });
    const stream = (
      await this.fileService.downloadFromS3(
        `${fileName}.xlsx`,
        `${process.env.AWS_S3_BUCKET}/excel`,
      )
    ).getStream();
    const students = await this.excelService.parseExcel(stream);
    await this.userRepository.migrateUsers(students);
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
      emoji: admin?.emoji,
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

    const pendingProjects = await this.userRepository.getPendingProjects(
      user.id,
    );
    const pendingReports = isMine
      ? pendingProjects[0]?.map((project) => {
          const type =
            project.status.isPlanSubmitted && !project.status.isPlanAccepted
              ? 'PLAN'
              : 'REPORT';
          return {
            uuid: project.uuid,
            projectName: project.name,
            thumbnailUrl: project.thumbnailUrl,
            emoji: project.emoji,
            type,
            status: this.projectService.getDocumentStatus(
              project,
              type.toLowerCase() as 'plan' | 'report',
            ) as 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED',
          };
        })
      : undefined;

    return {
      studentNo: user.studentNo,
      name: user.name,
      email: user.email,
      thumbnailUrl: user.thumbnailUrl,
      githubId: user.githubId,
      pendingCount: pendingProjects[1],
      pendingReports,
      projectCount: projects[1],
      projects: projects[0].map((project) => ({
        uuid: project.uuid,
        projectName: project.name,
        projectDescription: project.description,
        projectType: project.type,
        fields: project.field,
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
        members: project.members.map((member) => ({
          uuid: member.user.uuid,
          name: member.user.name,
          thumbnailUrl: member.user.thumbnailUrl,
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
        projectName: project.name,
        projectDescription: project.description,
        projectType: project.type,
        fields: project.field,
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
        members: project.members.map((member) => ({
          uuid: member.user.uuid,
          name: member.user.name,
          thumbnailUrl: member.user.thumbnailUrl,
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
      reports: res[0].map((project) => {
        return {
          uuid: project.uuid,
          projectName: project.projectname,
          thumbnailUrl: project.thumbnailurl,
          status: this.getDocumentStatus(
            project,
            project.type.toLowerCase() as 'plan' | 'report',
          ) as 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED',
          emoji: project.emoji,
          type: project.type,
        };
      }),
    }));

    return {
      ACCEPTED: projects[0],
      REJECTED: projects[1],
      PENDING: projects[2],
      NOT_SUBMITTED: projects[3],
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
      { ACCEPTED: true, REJECTED: false, PENDING: true, NOT_SUBMITTED: false }[
        query.type
      ],
      { ACCEPTED: true, REJECTED: false, PENDING: null, NOT_SUBMITTED: null }[
        query.type
      ],
    );

    return {
      [query.type]: {
        count: projects[1],
        reports: projects[0].map((project) => {
          return {
            uuid: project.uuid,
            projectName: project.projectname,
            thumbnailUrl: project.thumbnailurl,
            status: this.getDocumentStatus(
              project,
              project.type.toLowerCase() as 'plan' | 'report',
            ),
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
    await this.cacheManager.set(req.user.userId, 'DELETED', { ttl: 86400 });
    return;
  }

  async searchUser(
    req: Request,
    query: SearchUserRequestQueryDto,
  ): Promise<SearchUserDto> {
    return {
      students: (
        await this.userRepository.searchUser({
          ...query,
          excludeUuid: req.user.userId,
        })
      ).map((user) => ({
        uuid: user.uuid,
        studentNo: user.studentNo,
        name: user.name,
      })),
    };
  }

  getDocumentStatus(
    project: {
      isplansubmitted: boolean;
      isplanaccepted: boolean;
      isreportsubmitted: boolean;
      isreportaccepted: boolean;
    },
    type: 'plan' | 'report',
  ) {
    if (type === 'plan') {
      if (!project.isplansubmitted && project.isplanaccepted === null)
        return 'NOT_SUBMITTED';
      if (project.isplansubmitted && project.isplanaccepted === null)
        return 'PENDING';
      if (project.isplanaccepted) return 'ACCEPTED';
      if (!project.isplansubmitted && !project.isplanaccepted)
        return 'REJECTED';
    }
    if (type === 'report') {
      if (!project.isreportsubmitted && project.isreportaccepted === null)
        return 'NOT_SUBMITTED';
      if (project.isreportsubmitted && project.isreportaccepted === null)
        return 'PENDING';
      if (project.isreportaccepted) return 'ACCEPTED';
      if (!project.isreportsubmitted && !project.isreportaccepted)
        return 'REJECTED';
    }
  }
}
