import { AbstractRepository, EntityRepository } from 'typeorm';
import { Admin } from './admin.entity';

@EntityRepository(Admin)
export class AdminRepository extends AbstractRepository<Admin> {}
