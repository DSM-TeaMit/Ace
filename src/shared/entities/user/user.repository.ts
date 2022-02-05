import { AbstractRepository, EntityRepository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { v4 } from 'uuid';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {
  async findOne(email: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .select()
      .where('email = :email', { email })
      .getOne();
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
}
