import { InternalServerErrorException } from '@nestjs/common';
import { CreatePlanRequestDto } from 'src/project/dto/request/create-plan.dto';
import { CreateProjectRequestDto } from 'src/project/dto/request/create-project.dto';
import { CreateReportRequestDto } from 'src/project/dto/request/create-report.dto';
import { FeedRequestDto } from 'src/project/dto/request/feed.dto';
import { ModifyPlanRequestDto } from 'src/project/dto/request/modify-plan.dto';
import { ModifyProjectRequestDto } from 'src/project/dto/request/modify-project.dto';
import { ModifyReportRequestDto } from 'src/project/dto/request/modify-report.dto';
import { SearchTypeRequestDto } from 'src/project/dto/request/search.dto';
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
import { User } from '../user/user.entity';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {
  async createProject(
    payload: CreateProjectRequestDto,
    members: Partial<Member>[],
    writer: User,
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
            name: payload.name,
            type: payload.type,
            field: payload.field,
            emoji: getRandomEmoji(),
            writer: writer,
          })
          .execute()
      ).identifiers[0].id;
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            project: () => projectId.toString(),
            user: member.user,
            role: member.role,
            studentNo: member.studentNo,
          })),
        )
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Status)
        .values({
          project: () => projectId.toString(),
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
      throw new InternalServerErrorException();
    }
  }

  async modifyProject(
    projectId: number,
    payload: ModifyProjectRequestDto,
  ): Promise<UpdateResult> {
    return this.createQueryBuilder('project')
      .update(Project)
      .set({
        name: payload.name,
        description: payload.description,
        field: payload.field,
      })
      .where('project.id = :projectId', { projectId })
      .execute();
  }

  async modifyMember(
    projectId: number,
    members: Partial<Member>[],
  ): Promise<void> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Member)
        .where('project = :projectId', { projectId })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            project: () => projectId.toString(),
            user: member.user,
            role: member.role,
          })),
        )
        .execute();
      await queryRunner.commitTransaction();
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new InternalServerErrorException();
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
      .leftJoinAndSelect('project.writer', 'writer')
      .leftJoinAndSelect('members.user', 'user')
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

  async search(query: SearchTypeRequestDto): Promise<[Project[], number]> {
    const queryBuilderBase = this.createQueryBuilder('project')
      .select([
        'project.uuid',
        'project.thumbnailUrl',
        'project.emoji',
        'project.name',
        'project.type',
        'project.field',
        'project.viewCount',
        'status.isPlanAccepted',
        'status.isReportAccepted',
        'project.viewCount',
        'project.createdAt',
      ])
      .leftJoin('project.status', 'status')
      .andWhere('status.isPlanAccepted = true')
      .andWhere('status.isReportAccepted = true')
      .addOrderBy('project.viewCount', 'DESC')
      .addOrderBy('project.createdAt', 'DESC');

    if (query.searchBy === 'projectName')
      queryBuilderBase
        .where('project.name LIKE :keyword', {
          keyword: `%${query.keyword}%`,
        })
        .orderBy(`SIMILARITY(project.name, '${query.keyword}')`, 'DESC');
    if (query.searchBy === 'memberName')
      queryBuilderBase
        .addSelect(['user.name'])
        .leftJoin('project.members', 'members')
        .leftJoin('members.user', 'user')
        .where('user.name LIKE :keyword', {
          keyword: `%${query.keyword}%`,
        })
        .orderBy(`SIMILARITY(user.name, '${query.keyword}')`, 'DESC');

    const [searchQuery, parameters] = queryBuilderBase.getQueryAndParameters();
    const res = await Promise.all([
      this.manager.query(
        `${searchQuery} LIMIT $${parameters.length + 1} ${
          query.page > 1 ? `OFFSET ${query.limit * (query.page - 1)}` : ''
        }`,
        [...parameters, query.limit],
      ),
      this.manager.query(`SELECT COUNT(A) FROM (${searchQuery}) A`, parameters),
    ]);
    return [
      res[0].map((project) => ({
        uuid: project.project_uuid,
        thumbnailUrl: project.project_thumbnail_url,
        emoji: project.project_emoji,
        name: project.project_name,
        type: project.project_type,
        field: project.project_field,
        viewCount: project.project_view_count,
      })),
      +res[1][0].count,
    ];
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
        project: () => projectId.toString(),
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
      .leftJoinAndSelect('plan.project', 'project')
      .leftJoinAndSelect('project.writer', 'writer')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('member.user', 'user');

    if (projectId) qb.where('plan.project = :projectId', { projectId });
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
      .where('project = :id', { id })
      .execute();
  }

  async deletePlan(id: number) {
    this.manager
      .createQueryBuilder()
      .delete()
      .from(Plan, 'plan')
      .where('plan.project = :id', { id })
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
        project: () => projectId.toString(),
        ...payload,
      })
      .execute();
  }

  async getReport({ projectId, uuid }: { projectId?: number; uuid?: string }) {
    const qb = this.manager
      .createQueryBuilder()
      .select('report')
      .from(Report, 'report')
      .leftJoinAndSelect('report.project', 'project')
      .leftJoinAndSelect('project.writer', 'writer')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('member.user', 'user');

    if (projectId) qb.where('report.project = :projectId', { projectId });
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
      .where('project = :id', { id })
      .execute();
  }

  async deleteReport(id: number) {
    this.manager
      .createQueryBuilder()
      .delete()
      .from(Report, 'report')
      .where('project = :id', { id })
      .execute();
  }

  async updateConfirmed(id: number, type: 'plan' | 'report', value: boolean) {
    const qb = this.manager
      .createQueryBuilder()
      .update(Status)
      .where('project = :id', { id });

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
      .where('project = :id', { id });

    if (type === 'plan')
      qb.set({
        isPlanSubmitted: value,
        isPlanAccepted: null,
        planSubmittedAt: new Date(),
      });
    if (type === 'report')
      qb.set({
        isReportSubmitted: value,
        isPlanAccepted: null,
        reportSubmittedAt: new Date(),
      });

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
      .where('project = :id', { id });

    if (type === 'plan') qb.set({ isPlanAccepted: value });
    if (type === 'report') qb.set({ isReportAccepted: value });

    qb.execute();
  }

  async getPendingProjects(query: Omit<FeedRequestDto, 'order'>) {
    return this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.writer', 'writer')
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
