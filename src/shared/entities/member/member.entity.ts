import { Column, Entity, ManyToOne } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Member {
  @ManyToOne(() => Project, (project) => project.members, {
    primary: true,
    onDelete: 'CASCADE',
  })
  projectId: Project;

  @ManyToOne(() => User, (user) => user.members, { primary: true })
  userId: User;

  @Column({ length: 20 })
  role: string;
}
