import { AbstractRepository, EntityRepository } from 'typeorm';
import { Admin } from './admin.entity';

@EntityRepository(Admin)
export class AdminRepository extends AbstractRepository<Admin> {
  async findOne(uid: string): Promise<Admin> {
    return this.createQueryBuilder('admin')
      .select()
      .where('uid = :uid', { uid })
      .getOne();
  }

}
