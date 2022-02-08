import { RegisterAdminRequestDto } from 'src/auth/dto/request/register-admin.dto';
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

  async insertOne({ id, password, name }: RegisterAdminRequestDto) {
    return this.createQueryBuilder('admin')
      .insert()
      .into<Admin>('admin')
      .values({
        uid: id,
        uuid: v4(),
        password,
        name,
      })
      .execute();
  }
}
