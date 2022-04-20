import { RegisterAdminRequestDto } from 'src/auth/dto/request/register-admin.dto';
import { getRandomEmoji } from 'src/shared/utils/random-emoji';
import { AbstractRepository, DeleteResult, EntityRepository } from 'typeorm';
import { v4 } from 'uuid';
import { Admin } from './admin.entity';

@EntityRepository(Admin)
export class AdminRepository extends AbstractRepository<Admin> {
  async findOne({
    uid,
    uuid,
    joinParent,
  }: {
    uid?: string;
    uuid?: string;
    joinParent?: boolean;
  }): Promise<Admin> {
    const qb = this.createQueryBuilder('admin').select();

    if (joinParent)
      qb.leftJoinAndSelect('admin.parentAccount', 'parentAccount');
    if (uid) qb.where('admin.uid = :uid', { uid });
    if (uuid) qb.where('admin.uuid = :uuid', { uuid });

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

  async getAdminList(userId: string, page: number, limit: number) {
    return this.createQueryBuilder('admin')
      .select()
      .where('admin.uuid != :userId', { userId })
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();
  }

  async deleteAccount(id: number): Promise<DeleteResult> {
    return this.createQueryBuilder('admin')
      .delete()
      .where('admin.id = :id', { id })
      .execute();
  }
}
