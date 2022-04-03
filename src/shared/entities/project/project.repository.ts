import { CreatePlanRequestDto } from 'src/project/dto/request/create-plan.dto';
import { CreateProjectRequestDto } from 'src/project/dto/request/create-project.dto';
import { CreateReportRequestDto } from 'src/project/dto/request/create-report.dto';
import { FeedRequestDto } from 'src/project/dto/request/feed.dto';
import { ModifyPlanRequestDto } from 'src/project/dto/request/modify-plan.dto';
import { ModifyProjectRequestDto } from 'src/project/dto/request/modify-project.dto';
import { ModifyReportRequestDto } from 'src/project/dto/request/modify-report.dto';
import { SearchRequestDto } from 'src/project/dto/request/search.dto';
import { getRandomEmoji } from 'src/shared/utils/random-emoji';
import {
  AbstractRepository,
  Brackets,
  EntityRepository,
  getConnection,
  UpdateResult,
} from 'typeorm';
import { v4 } from 'uuid';
import { Member } from '../member/member.entity';
import { Plan } from '../plan/plan.entity';
import { Report } from '../report/report.entity';
import { Status } from '../status/status.entity';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {
  async createProject(
    payload: CreateProjectRequestDto,
    members: {
      id: number;
      role: string;
    }[],
    writerId: number,
  ): Promise<string | undefined> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const uuid = v4();
    try {
      const projectId: number = (
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(Project)
          .values({
            uuid: uuid,
            projectName: payload.name,
            projectType: payload.type,
            field: payload.field,
            emoji: getRandomEmoji(),
            writerId: () => writerId.toString(),
          })
          .execute()
      ).identifiers[0].id;
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            projectId: () => projectId.toString(),
            userId: () => member.id.toString(),
            role: member.role,
          })),
        )
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Status)
        .values({
          projectId: () => projectId.toString(),
          isPlanSubmitted: false,
          isReportSubmitted: false,
        })
        .execute();

      await queryRunner.commitTransaction();
      return uuid;
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    }
  }

  async modifyProject(
    projectId: number,
    payload: ModifyProjectRequestDto,
  ): Promise<UpdateResult> {
    return this.createQueryBuilder('project')
      .update(Project)
      .set({
        projectName: payload.name,
        projectDescription: payload.description,
        field: payload.field,
      })
      .where('project.id = :projectId', { projectId })
      .execute();
  }

  async modifyMember(
    projectId: number,
    members: {
      id: number;
      role: string;
    }[],
  ): Promise<void> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Member)
        .where('projectId = :projectId', { projectId })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            projectId: () => projectId.toString(),
            userId: () => member.id.toString(),
            role: member.role,
          })),
        )
        .execute();
      await queryRunner.commitTransaction();
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    }
  }

  async updateThumbnailUrl({
    uuid,
    id,
    thumbnailUrl,
  }: {
    uuid?: string;
    id?: string;
    thumbnailUrl: string;
  }) {
    const qb = this.createQueryBuilder('project')
      .update()
      .set({ thumbnailUrl });
    if (uuid) qb.where('project.uuid = :uuid', { uuid });
    if (id) qb.where('project.id = :id', { id });

    return qb.execute();
  }

  async findOne({ uuid, id }: { uuid?: string; id?: string }) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('project.writerId', 'writerId')
      .leftJoinAndSelect('members.userId', 'userId')
      .leftJoinAndSelect('project.status', 'status');
    if (uuid) qb.where('project.uuid = :uuid', { uuid });
    if (id) qb.where('project.id = :id', { id });

    return qb.getOne();
  }

  async deleteProject(uuid: string) {
    return Boolean(
      (
        await this.createQueryBuilder('project')
          .delete()
          .from(Project)
          .where('project.uuid = :uuid', { uuid })
          .execute()
      ).affected,
    );
  }

  async getDoneProjects(
    page: number,
    limit: number,
    {
      popularity,
      recently,
    }: {
      popularity?: boolean;
      recently?: boolean;
    },
  ) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .where('status.isPlanAccepted = true')
      .andWhere('status.isReportAccepted = true')
      .take(limit)
      .skip(limit * (page - 1));

    if (popularity)
      qb.orderBy('project.viewCount', 'DESC').addOrderBy(
        'project.createdAt',
        'DESC',
      );
    if (recently)
      qb.orderBy('project.createdAt', 'DESC').addOrderBy(
        'project.viewCount',
        'DESC',
      );
    return qb.getManyAndCount();
  }

  async search(query: SearchRequestDto) {
    const qb = this.createQueryBuilder('project')
      .select()
      .where('project.projectName LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      })
      .leftJoinAndSelect('project.status', 'status')
      .andWhere('status.isPlanAccepted = true')
      .andWhere('status.isReportAccepted = true')
      .take(query.limit)
      .skip(query.limit * (query.page - 1));
    if (query.order === 'popularity')
      qb.orderBy('project.viewCount', 'DESC').addOrderBy(
        'project.createdAt',
        'DESC',
      );
    if (query.order === 'recently')
      qb.orderBy('project.createdAt', 'DESC').addOrderBy(
        'project.viewCount',
        'DESC',
      );
    return qb.getManyAndCount();
  }

  async searchByMember(query: SearchRequestDto) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.userId', 'userId')
      .where('userId.name LIKE :keyword', {
        keyword: `%${query.keyword}%`,
      })
      .leftJoinAndSelect('project.status', 'status')
      .andWhere('status.isPlanAccepted = true')
      .andWhere('status.isReportAccepted = true')
      .take(query.limit)
      .skip(query.limit * (query.page - 1));
    if (query.order === 'popularity')
      qb.orderBy('project.viewCount', 'DESC').addOrderBy(
        'project.createdAt',
        'DESC',
      );
    if (query.order === 'recently')
      qb.orderBy('project.createdAt', 'DESC').addOrderBy(
        'project.viewCount',
        'DESC',
      );
    return qb.getManyAndCount();
  }

  async createPlan(
    projectId: number,
    payload: CreatePlanRequestDto,
  ): Promise<void> {
    this.manager
      .createQueryBuilder()
      .insert()
      .into(Plan)
      .values({
        projectId: () => projectId.toString(),
        goal: payload.goal,
        content: payload.content,
        startDate: payload.startDate,
        endDate: payload.endDate,
        includeResultReport: payload.includes.report,
        includeCode: payload.includes.code,
        includeOutcome: payload.includes.outcome,
        includeOthers: payload.includes.others,
      })
      .execute();
  }

  async getPlan({ projectId, uuid }: { projectId?: number; uuid?: string }) {
    const qb = this.manager
      .createQueryBuilder()
      .select('plan')
      .from(Plan, 'plan')
      .leftJoinAndSelect('plan.projectId', 'project')
      .leftJoinAndSelect('project.writerId', 'writer')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('member.userId', 'user');

    if (projectId) qb.where('plan.projectId = :projectId', { projectId });
    if (uuid)
      qb.where('project.uuid = :uuid', {
        uuid,
      });

    return qb.getOne();
  }

  async modifyPlan(id: number, payload: ModifyPlanRequestDto) {
    this.manager
      .createQueryBuilder()
      .update(Plan)
      .set({
        goal: payload.goal,
        content: payload.content,
        startDate: payload.startDate,
        endDate: payload.endDate,
        includeResultReport: payload.includes.report,
        includeCode: payload.includes.code,
        includeOutcome: payload.includes.outcome,
        includeOthers: payload.includes.others,
      })
      .where('projectId = :id', { id })
      .execute();
  }

  async deletePlan(id: number) {
    this.manager
      .createQueryBuilder()
      .delete()
      .from(Plan, 'plan')
      .where('plan.projectId = :id', { id })
      .execute();
  }

  async createReport(
    projectId: number,
    payload: CreateReportRequestDto,
  ): Promise<void> {
    this.manager
      .createQueryBuilder()
      .insert()
      .into(Report)
      .values({
        projectId: () => projectId.toString(),
        ...payload,
      })
      .execute();
  }

  async getReport({ projectId, uuid }: { projectId?: number; uuid?: string }) {
    const qb = this.manager
      .createQueryBuilder()
      .select('report')
      .from(Report, 'report')
      .leftJoinAndSelect('report.projectId', 'project')
      .leftJoinAndSelect('project.writerId', 'writer')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('member.userId', 'user');

    if (projectId) qb.where('report.projectId = :projectId', { projectId });
    if (uuid)
      qb.where('project.uuid = :uuid', {
        uuid,
      });

    return qb.getOne();
  }

  async modifyReport(id: number, payload: ModifyReportRequestDto) {
    this.manager
      .createQueryBuilder()
      .update(Report)
      .set({
        ...payload,
      })
      .where('projectId = :id', { id })
      .execute();
  }

  async deleteReport(id: number) {
    this.manager
      .createQueryBuilder()
      .delete()
      .from(Report, 'report')
      .where('projectId = :id', { id })
      .execute();
  }

  async updateConfirmed(id: number, type: 'plan' | 'report', value: boolean) {
    const qb = this.manager
      .createQueryBuilder()
      .update(Status)
      .where('projectId = :id', { id });

    if (type === 'plan') {
      if (!value) qb.set({ isPlanSubmitted: value, isPlanAccepted: value });
      else qb.set({ isPlanAccepted: value });
    }
    if (type === 'report') {
      if (!value) qb.set({ isReportSubmitted: value, isReportAccepted: value });
      else qb.set({ isReportAccepted: value });
    }

    qb.execute();
  }

  async updateSubmitted(id: number, type: 'plan' | 'report', value: boolean) {
    const qb = this.manager
      .createQueryBuilder()
      .update(Status)
      .where('projectId = :id', { id });

    if (type === 'plan')
      qb.set({ isPlanSubmitted: value, planSubmittedAt: new Date() });
    if (type === 'report')
      qb.set({ isReportSubmitted: value, reportSubmittedAt: new Date() });

    qb.execute();
  }

  async setAccepted(
    id: number,
    type: 'plan' | 'report',
    value: boolean | null,
  ) {
    const qb = this.manager
      .createQueryBuilder()
      .update(Status)
      .where('projectId = :id', { id });

    if (type === 'plan') qb.set({ isPlanAccepted: value });
    if (type === 'report') qb.set({ isReportAccepted: value });

    qb.execute();
  }

  async getPendingProjects(query: Omit<FeedRequestDto, 'order'>) {
    return this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .where(
        new Brackets((qb) => {
          qb.where('status.isPlanSubmitted = true').andWhere(
            'status.isPlanAccepted IS NULL',
          );
        }),
      )
      .orWhere(
        new Brackets((qb) => {
          qb.where('status.isReportSubmitted = true').andWhere(
            'status.isReportAccepted IS NULL',
          );
        }),
      )
      .take(query.limit)
      .skip(query.limit * (query.page - 1))
      .getManyAndCount();
  }

  async increaseViewCount(id: number, count: number) {
    return this.createQueryBuilder('project')
      .update()
      .set({ viewCount: count + 1 })
      .where('project.id = :id', { id })
      .execute();
  }
}
