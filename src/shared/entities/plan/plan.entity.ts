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
  @OneToOne(() => Project, (project) => project.plan, { primary: true })
  @JoinColumn()
  projectId: number;

  @Column({ length: 4000 })
  goal: string;

  @Column({ length: 10000 })
  content: string;

  @Column({ length: 7 })
  startDate: string;

  @Column({ length: 7 })
  endDate: string;

  @Column()
  includeResultReport: boolean;

  @Column()
  includeCode: boolean;

  @Column()
  includeOutcome: boolean;

  @Column({ length: 15 })
  includeOthers: string;

  @CreateDateColumn()
  createdAt: Date;
}
