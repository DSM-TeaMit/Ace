import { AbstractRepository, EntityRepository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Comment } from './comment.entity';

@EntityRepository(Comment)
export class CommentRepository extends AbstractRepository<Comment> {
  async findMany(projectId: number, type: 'PROJECT' | 'PLAN' | 'REPORT') {
    return this.createQueryBuilder('comment')
      .select()
      .leftJoinAndSelect('comment.adminId', 'adminId')
      .leftJoinAndSelect('comment.userId', 'userId')
      .where('comment.projectId = :projectId', { projectId })
      .andWhere('comment.type = :type', { type })
      .getManyAndCount();
  }

  async createComment(
    projectId: number,
    type: 'PROJECT' | 'PLAN' | 'REPORT',
    payload: QueryDeepPartialEntity<Comment>,
  ) {
    return this.createQueryBuilder('comment')
      .insert()
      .values({
        ...payload,
        projectId: () => projectId.toString(),
        type,
      })
      .execute();
  }
}
