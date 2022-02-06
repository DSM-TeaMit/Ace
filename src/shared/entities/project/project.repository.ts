import { AbstractRepository, Brackets, EntityRepository } from 'typeorm';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {
  async getProjectsOfUser(
    userId: number,
    isMine: boolean,
    page: number,
    limit: number,
  ) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.userId', 'userId')
      .where('members.userId = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    if (!isMine)
      qb.leftJoinAndSelect('project.status', 'status').andWhere(
        'report.isReportAccepted = true',
      );

    return qb.getManyAndCount();
  }

  async getPendingProjects(userId?: number) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.members', 'members')
      .where(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where('status.isPlanSubmitted = true').andWhere(
                new Brackets((qb) => {
                  qb.where('status.isPlanAccepted IS NULL').orWhere(
                    'status.isPlanAccepted = false',
                  );
                }),
              );
            }),
          );
          qb.orWhere(
            new Brackets((qb) => {
              qb.where('status.isReportSubmitted = true').andWhere(
                new Brackets((qb) => {
                  qb.where('status.isReportAccepted IS NULL').orWhere(
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
    return this.createQueryBuilder('project')
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
}
