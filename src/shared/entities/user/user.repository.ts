import { AbstractRepository, Brackets, EntityRepository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';
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
      .where('project.id = member.projectId')
      .andWhere('member.userId = :userId');

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
      .leftJoinAndSelect('members.userId', 'userId')
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
    if (userId) qb.andWhere('members.userId = :userId', { userId });

    return qb.getManyAndCount();
  }

  async getReports(
    userId: number,
    page: number,
    limit: number,
    submitted: boolean | null,
    accepted: boolean | null,
  ) {
    return this.manager
      .createQueryBuilder(Project, 'project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.members', 'members')
      .where(
        new Brackets((qb) => {
          qb.where(
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
          );
          qb.orWhere(
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
          );
        }),
      )
      .andWhere('members.userId = :userId', { userId })
      .take(limit)
      .skip(limit * (page - 1))
      .getManyAndCount();
  }

  async searchUser({ name }: { name: string }) {
    const qb = this.createQueryBuilder('user')
      .select()
      .where('user.deleted = false');

    if (name) qb.andWhere('user.name = :name', { name });

    return qb.getMany();
  }
}
