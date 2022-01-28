import { AbstractRepository, EntityRepository } from 'typeorm';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {}
