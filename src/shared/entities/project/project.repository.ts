import { AbstractRepository, EntityRepository } from 'typeorm';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {
  async getProjectsOfUser(userId: number, isMine: boolean) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.userId', 'userId')
      .where('members.userId = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .take(4);
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
      .where((qb) => {
        qb.where((qb) => {
          qb.where('status.isPlanSubmitted = true').andWhere(
            'status.isPlanAccepted IS NULL',
          );
        });
        qb.orWhere((qb) => {
          qb.where('status.isReportSubmitted = true').andWhere(
            'status.isReportAccepted IS NULL',
          );
        });
      })
      .take(4);
    if (userId) qb.andWhere('members.userId = :userId', { userId });

    return qb.getManyAndCount();
  }
}
