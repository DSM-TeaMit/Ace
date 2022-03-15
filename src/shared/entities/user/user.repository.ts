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
  ) {
    const subquery = this.manager
      .createQueryBuilder()
      .select('1')
      .from(Member, 'member')
      .where('project.id = member.projectId')
      .andWhere('member.userId = :userId');

    const qb = this.manager
      .createQueryBuilder(Project, 'project')
      .select(['project.id'])
      .where(`EXISTS (${subquery.getQuery()})`, { userId })
      .orderBy('project.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    if (!isMine)
      qb.leftJoinAndSelect('project.status', 'status').andWhere(
        'report.isReportAccepted = true',
      );

    return this.manager
      .createQueryBuilder(Project, 'project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.userId', 'userId')
      .where('project.id IN (:...ids)', {
        ids: (await qb.getMany()).map((project) => project.id),
      })
      .orderBy('project.createdAt', 'DESC')
      .getManyAndCount();
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
    type: boolean | null,
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
              qb.where('status.isPlanSubmitted = true').andWhere(
                type !== null
                  ? 'status.isPlanAccepted = :type'
                  : 'status.isPlanAccepted IS NULL',
                { type },
              );
            }),
          );
          qb.orWhere(
            new Brackets((qb) => {
              qb.where('status.isReportSubmitted = true').andWhere(
                type !== null
                  ? 'status.isReportAccepted = :type'
                  : 'status.isReportAccepted IS NULL',
                { type },
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
