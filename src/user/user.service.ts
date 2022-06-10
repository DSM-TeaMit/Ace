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
import { SearchUserRequestQueryDto } from './dto/request/search-user.dto';
import { HeaderInfoResponseDto } from './dto/response/header-info.dto';
import { ProfileMainResponseDto } from './dto/response/profile-main.dto';
import { ProfileProjectsResponseDto } from './dto/response/profile-projects.dto';
import { ProfileReportsResponseDto } from './dto/response/profile-reports.dto';
import { SearchUserResponseDto } from './dto/response/search-user.dto';

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

  async migrateUsers(file: Express.MulterS3.File): Promise<void> {
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
    return new HeaderInfoResponseDto(admin, user, req.user.role);
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
      ? await this.userRepository.getPendingProjects(user.id)
      : ([[], 0] as [Project[], number]);

    return new ProfileMainResponseDto(user, projects, pendingProjects);
  }

  async getProjects(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileRequestQueryDto,
  ): Promise<ProfileProjectsResponseDto> {
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

    return new ProfileProjectsResponseDto(projects);
  }

  async getReports(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileRequestQueryDto,
  ): Promise<ProfileReportsResponseDto> {
    const uuid = param.uuid ?? req.user.userId;
    const isMine = !param.uuid || param.uuid === req.user.userId;
    if (!isMine) throw new ForbiddenException();
    const user = await this.userRepository.findOneByUuid(uuid);

    const projects = await Promise.all([
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
    ]);

    return new ProfileReportsResponseDto(projects);
  }

  async getEachReports(
    req: Request,
    param: ProfileRequestDto,
    query: ProfileEachReportRequestQueryDto,
  ): Promise<ProfileReportsResponseDto> {
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

    return new ProfileReportsResponseDto([projects], query.type);
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
  }

  async deleteUser(req: Request): Promise<void> {
    await this.userRepository.deleteUser(req.user.userId);
    await this.cacheManager.set(req.user.userId, 'DELETED', { ttl: 86400 });
  }

  async searchUser(
    req: Request,
    query: SearchUserRequestQueryDto,
  ): Promise<SearchUserResponseDto> {
    const users = await this.userRepository.searchUser({
      ...query,
      excludeUuid: req.user.userId,
    });

    return new SearchUserResponseDto(users);
  }
}
