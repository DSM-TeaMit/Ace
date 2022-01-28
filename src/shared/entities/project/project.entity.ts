import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../comment/comment.entity';
import { Member } from '../member/member.entity';
import { Plan } from '../plan/plan.entity';
import { Report } from '../report/report.entity';
import { Status } from '../status/status.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 36 })
  uuid: string;

  @Column({ length: 45 })
  projectName: string;

  @Column({ length: 250 })
  projectDescription: string;

  @Column({ length: 250 })
  projectResult: string;

  @Column({ type: 'enum', enum: ['PERS', 'TEAM', 'CLUB'] })
  projectType: 'PERS' | 'TEAM' | 'CLUB';

  @Column()
  viewCount: number;

  @Column({ length: 20 })
  field: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Status, (status) => status.projectId)
  status: Status;

  @OneToOne(() => Plan, (plan) => plan.projectId)
  plan: Plan;

  @OneToOne(() => Report, (report) => report.projectId)
  report: Report;

  @OneToMany(() => Member, (member) => member.projectId)
  members: Member[];

  @OneToMany(() => Comment, (comment) => comment.projectId)
  comments: Comment[];
}
