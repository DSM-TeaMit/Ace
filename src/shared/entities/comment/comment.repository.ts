import { AbstractRepository, EntityRepository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Comment } from './comment.entity';

@EntityRepository(Comment)
export class CommentRepository extends AbstractRepository<Comment> {
  async findMany(projectId: number, type: 'PROJECT' | 'PLAN' | 'REPORT') {
    return this.createQueryBuilder('comment')
      .select()
      .leftJoinAndSelect('comment.admin', 'admin')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.project = :projectId', { projectId })
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
        project: () => projectId.toString(),
        type,
      })
      .execute();
  }

  async findOne(uuid: string): Promise<Comment> {
    return this.createQueryBuilder('comment')
      .select()
      .where('comment.uuid = :uuid', { uuid })
      .leftJoinAndSelect('comment.admin', 'admin')
      .leftJoinAndSelect('comment.user', 'user')
      .getOne();
  }

  async delete(uuid: string): Promise<void> {
    this.createQueryBuilder('comment')
      .delete()
      .where('comment.uuid = :uuid', { uuid })
      .execute();
  }
}
