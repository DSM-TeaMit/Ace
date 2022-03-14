import { Request } from 'express';
import { RegisterAdminRequestDto } from 'src/auth/dto/request/register-admin.dto';
import { getRandomEmoji } from 'src/shared/utils/random-emoji';
import { AbstractRepository, EntityRepository } from 'typeorm';
import { v4 } from 'uuid';
import { Admin } from './admin.entity';

@EntityRepository(Admin)
export class AdminRepository extends AbstractRepository<Admin> {
  async findOne(uid?: string, uuid?: string): Promise<Admin> {
    const qb = this.createQueryBuilder('admin').select();
    if (uid) qb.where('uid = :uid', { uid });
    if (uuid) qb.where('uuid = :uuid', { uuid });
    return qb.getOne();
  }

  async insertOne(
    admin: Admin,
    { id, password, name }: RegisterAdminRequestDto,
  ) {
    return this.createQueryBuilder('admin')
      .insert()
      .into<Admin>('admin')
      .values({
        uid: id,
        uuid: v4(),
        password,
        name,
        emoji: getRandomEmoji(),
        parentAccount: admin,
      })
      .execute();
  }

  async getChildAccounts(id: number): Promise<[Admin[], number]> {
    return this.createQueryBuilder('admin')
      .select()
      .where('admin.parentAccount = :id', { id })
      .getManyAndCount();
  }
}
