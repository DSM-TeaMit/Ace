import { AbstractRepository, EntityRepository } from 'typeorm';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {
  async findOne(email: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .select()
      .where('email = :email', { email })
      .getOne();
  }
}
