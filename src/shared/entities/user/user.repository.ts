import {
  AbstractRepository,
  Brackets,
  EntityRepository,
  getConnection,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';
import { cloneDeep } from 'lodash';
import { Member } from '../member/member.entity';
import { Project } from '../project/project.entity';
import { User } from './user.entity';
import { InternalServerErrorException } from '@nestjs/common';

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {
  async findOne(email?: string, uuid?: string): Promise<User> {
    const qb = this.createQueryBuilder('user').select();
    if (email) qb.where('email = :email', { email });
    if (uuid) qb.where('uuid = :uuid', { uuid });
    return qb.getOne();
  }

  async insert(payload: QueryDeepPartialEntity<User>) {
    return this.createQueryBuilder('user')
      .insert()
      .into(User)
      .values({
        ...payload,
        uuid: v4(),
      })
      .execute();
  }

  async findOneByUuid(uuid: string): Promise<User | undefined> {
    const user = await this.createQueryBuilder('user')
      .select()
      .where('user.uuid = :uuid', { uuid })
      .getOne();

    return user;
  }

  async updateGithubId(userId: number, githubId: string): Promise<boolean> {
    return Boolean(
      (
        await this.createQueryBuilder('user')
          .update(User)
          .set({ githubId })
          .where('id = :userId', { userId })
          .execute()
      ).affected,
    );
  }

  async deleteUser(uuid: string) {
    return this.createQueryBuilder('user')
      .update(User)
      .set({ deleted: true })
      .where('uuid = :uuid', { uuid })
      .execute();
  }

  async getProjectsOfUser(
    userId: number,
    isMine: boolean,
    page: number,
    limit: number,
  ): Promise<[Project[], number]> {
    const subquery = this.manager
      .createQueryBuilder()
      .select('1')
      .from(Member, 'member')
      .where('project.id = member.project')
      .andWhere('member.user = :userId');

    const qb = this.manager
      .createQueryBuilder(Project, 'project')
      .select('project')
      .where(`EXISTS (${subquery.getQuery()})`, { userId })
      .orderBy('project.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    if (!isMine)
      qb.leftJoinAndSelect('project.status', 'status').andWhere(
        'status.isReportAccepted = true',
      );
    const projects = await qb.getManyAndCount();
    if (!projects[1]) return [[], 0];

    const res = this.manager
      .createQueryBuilder()
      .select('project')
      .from(Project, 'project')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .orderBy('project.createdAt', 'DESC')
      .where('project.id IN (:...ids)', {
        ids: projects[0].map((project) => project.id),
      });

    return [await res.getMany(), projects[1]];
  }

  async getPendingProjects(userId?: number) {
    const qb = this.manager
      .createQueryBuilder(Project, 'project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.members', 'members')
      .where(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where(
                new Brackets((qb) => {
                  qb.where('status.isPlanSubmitted = true').andWhere(
                    'status.isPlanAccepted IS NULL',
                  );
                }),
              ).orWhere(
                new Brackets((qb) => {
                  qb.where('status.isPlanSubmitted = false').andWhere(
                    'status.isPlanAccepted = false',
                  );
                }),
              );
            }),
          );
          qb.orWhere(
            new Brackets((qb) => {
              qb.where(
                new Brackets((qb) => {
                  qb.where('status.isReportSubmitted = true').andWhere(
                    'status.isReportAccepted IS NULL',
                  );
                }),
              ).orWhere(
                new Brackets((qb) => {
                  qb.where('status.isReportSubmitted = false').andWhere(
                    'status.isReportAccepted = false',
                  );
                }),
              );
            }),
          );
        }),
      )
      .take(4);
    if (userId) qb.andWhere('members.user = :userId', { userId });

    return qb.getManyAndCount();
  }

  async getReports(
    userId: number,
    page: number,
    limit: number,
    submitted: boolean | null,
    accepted: boolean | null,
  ): Promise<
    [
      {
        uuid: string;
        projectname: string;
        thumbnailurl?: string;
        emoji: string;
        type: 'PLAN' | 'REPORT';
        isplansubmitted: boolean;
        isplanaccepted: boolean;
        isreportsubmitted: boolean;
        isreportaccepted: boolean;
      }[],
      number,
    ]
  > {
    const queryBuilderBase = this.manager
      .createQueryBuilder()
      .select([
        'project.id AS id',
        'project.uuid AS uuid',
        'project.name AS projectName',
        'project.thumbnailUrl AS thumbnailUrl',
        'project.emoji AS emoji',
        'status.isPlanSubmitted AS isPlanSubmitted',
        'status.isPlanAccepted AS isPlanAccepted',
        'status.isReportSubmitted AS isReportSubmitted',
        'status.isReportAccepted AS isReportAccepted',
      ])
      .from(Project, 'project')
      .leftJoin('project.status', 'status')
      .leftJoin('project.members', 'members')
      .where('members.user = :userId', { userId })
      .take(limit)
      .skip(limit * (page - 1));

    const planQuery = cloneDeep(queryBuilderBase)
      .addSelect(["'PLAN' AS type", 'status.planSubmittedAt AS submittedAt'])
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            submitted !== null
              ? 'status.isPlanSubmitted = :submitted'
              : 'status.isPlanSubmitted IS NULL',
            { submitted },
          ).andWhere(
            accepted !== null
              ? 'status.isPlanAccepted = :accepted'
              : 'status.isPlanAccepted IS NULL',
            { accepted },
          );
        }),
      )
      .andWhere(
        'EXISTS(SELECT 1 FROM "plan" "plan" WHERE project.id = plan.project_id)',
      )
      .getQueryAndParameters();

    const reportQuery = cloneDeep(queryBuilderBase)
      .addSelect([
        "'REPORT' AS type",
        'status.reportSubmittedAt AS submittedAt',
      ])
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            submitted !== null
              ? 'status.isReportSubmitted = :submitted'
              : 'status.isReportSubmitted IS NULL',
            { submitted },
          ).andWhere(
            accepted !== null
              ? 'status.isReportAccepted = :accepted'
              : 'status.isReportAccepted IS NULL',
            { accepted },
          );
        }),
      )
      .andWhere(
        'EXISTS(SELECT 1 FROM "report" "report" WHERE project.id = report.project_id)',
      )
      .getQueryAndParameters();

    const parameters = [...planQuery[1], limit];
    if (page > 1) parameters.push(limit * (page - 1));
    const res = await Promise.all([
      this.manager.query(
        `((${planQuery[0]}) UNION (${
          reportQuery[0]
        })) ORDER BY submittedAt DESC, id DESC LIMIT $${
          planQuery[1].length + 1
        } ${page > 1 ? `OFFSET $${planQuery[1].length + 2}` : ''}`,
        parameters,
      ),
      this.manager.query(
        `SELECT COUNT(*) FROM ((${planQuery[0]}) UNION (${reportQuery[0]})) A`,
        planQuery[1],
      ),
    ]);
    return [res[0], +res[1][0].count];
  }

  async searchUser({
    name,
    excludeUuid,
  }: {
    name: string;
    excludeUuid: string;
  }) {
    const qb = this.createQueryBuilder('user')
      .select()
      .where('user.deleted = false')
      .andWhere('user.name LIKE :keyword', { keyword: `%${name}%` })
      .andWhere('user.uuid != :excludeUuid', { excludeUuid });

    return qb.getMany();
  }

  async migrateUsers(
    students: {
      studentNo: number;
      name: string;
      email: string;
      enrollYear: number;
    }[],
  ) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');
    try {
      await queryRunner.query('LOCK TABLE "user" IN ACCESS EXCLUSIVE MODE');
      await queryRunner.manager
        .createQueryBuilder()
        .update(User)
        .set({
          deleted: true,
        })
        .execute();
      for (const student of students) {
        const res = await queryRunner.manager.findOne(User, {
          where: { email: student.email, enrollYear: student.enrollYear },
        });
        if (!res)
          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(User)
            .values({
              uuid: v4(),
              ...student,
            })
            .execute();
        if (res)
          await queryRunner.manager
            .createQueryBuilder()
            .update(User)
            .set({ studentNo: student.studentNo, deleted: false })
            .where('id = :id', { id: res.id })
            .execute();
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      await queryRunner.release();
      throw new InternalServerErrorException();
    }
  }
}
