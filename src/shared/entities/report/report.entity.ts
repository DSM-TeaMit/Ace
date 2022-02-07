import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Project } from '../project/project.entity';

@Entity()
export class Report {
  @OneToOne(() => Project, (project) => project.report, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  projectId: Project;

  @Column({ length: 40 })
  subject: string;

  @Column({ length: 15000 })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
