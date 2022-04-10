import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../admin/admin.entity';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.comments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  project: Project;

  @Column({ length: 36 })
  uuid: string;

  @ManyToOne(() => Admin, (admin) => admin.comments, { nullable: true })
  admin: Admin;

  @ManyToOne(() => User, (user) => user.comments, { nullable: true })
  user: User;

  @Column({ type: 'enum', enum: ['PROJECT', 'PLAN', 'REPORT'] })
  type: 'PROJECT' | 'PLAN' | 'REPORT';

  @Column({ length: 200 })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
