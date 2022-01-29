import { AbstractRepository, EntityRepository } from 'typeorm';
import { Comment } from './comment.entity';

@EntityRepository()
export class CommentRepository extends AbstractRepository<Comment> {}
