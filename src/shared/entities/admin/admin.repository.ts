import { RegisterAdminRequestDto } from 'src/auth/dto/request/register-admin.dto';
import { AbstractRepository, EntityRepository } from 'typeorm';
import { v4 } from 'uuid';
import { Admin } from './admin.entity';

@EntityRepository(Admin)
export class AdminRepository extends AbstractRepository<Admin> {
  async findOne(uid: string): Promise<Admin> {
    return this.createQueryBuilder('admin')
      .select()
      .where('uid = :uid', { uid })
      .getOne();
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
