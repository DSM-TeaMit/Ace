import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Project } from '../project/project.entity';

@Entity()
export class Plan {
  @OneToOne(() => Project, (project) => project.plan, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Project;

  @Column({ length: 4000 })
  goal: string;

  @Column({ length: 10000 })
  content: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column()
  includeResultReport: boolean;

  @Column()
  includeCode: boolean;

  @Column()
  includeOutcome: boolean;

  @Column({ length: 15, nullable: true })
  includeOthers: string;

  @CreateDateColumn()
  createdAt: Date;
}
