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

}
