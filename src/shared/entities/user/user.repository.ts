import { AbstractRepository, Brackets, EntityRepository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';
import { cloneDeep } from 'lodash';
import { Member } from '../member/member.entity';
import { Project } from '../project/project.entity';
import { User } from './user.entity';

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
        type: 'plan' | 'report';
        submittedAt: Date;
      }[],
      number,
    ]
  > {
    const queryBuilderBase = this.manager
      .createQueryBuilder()
      .select([
        'project.id AS id',
        'project.uuid AS uuid',
        'project.projectName AS projectName',
        'project.thumbnailUrl AS thumbnailUrl',
        'project.emoji AS emoji',
      ])
      .from(Project, 'project')
      .leftJoin('project.status', 'status')
      .leftJoin('project.members', 'members')
      .where('members.user = :userId', { userId })
      .take(limit)
      .skip(limit * (page - 1));

    const planQuery = cloneDeep(queryBuilderBase)
      .addSelect(["'plan' AS type", 'status.planSubmittedAt AS submittedAt'])
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
      .getQueryAndParameters();

    const reportQuery = cloneDeep(queryBuilderBase)
      .addSelect([
        "'report' AS type",
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
      .getQueryAndParameters();

    const parameters = [...planQuery[1], limit];
    if (page > 1) parameters.push([limit * (page - 1)]);
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

  async searchUser({ name }: { name: string }) {
    const qb = this.createQueryBuilder('user')
      .select()
      .where('user.deleted = false');

    if (name) qb.andWhere('user.name = :name', { name });

    return qb.getMany();
  }
}
