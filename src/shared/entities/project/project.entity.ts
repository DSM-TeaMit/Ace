import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../comment/comment.entity';
import { Member } from '../member/member.entity';
import { Plan } from '../plan/plan.entity';
import { Report } from '../report/report.entity';
import { Status } from '../status/status.entity';
import { User } from '../user/user.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 36 })
  @Index()
  uuid: string;

  @Column({ length: 45 })
  projectName: string;

  @Column({ length: 250, nullable: true })
  projectDescription?: string;

  @Column({ length: 250, nullable: true })
  projectResult?: string;

  @Column({ type: 'enum', enum: ['PERS', 'TEAM', 'CLUB'] })
  projectType: 'PERS' | 'TEAM' | 'CLUB';

  @Column({ default: 0 })
  viewCount: number;

  @Column({ length: 200, nullable: true })
  thumbnailUrl: string;

  @Column({ length: 1, nullable: true })
  emoji: string;

  @Column({ length: 20 })
  field: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.projects, { nullable: false })
  writerId: User;

  @OneToMany(() => Comment, (comment) => comment.project)
  comments: Comment[];

  @OneToMany(() => Member, (member) => member.project)
  members: Member[];

  @OneToOne(() => Plan, (plan) => plan.projectId)
  plan: Plan;

  @OneToOne(() => Report, (report) => report.projectId)
  report: Report;

  @OneToOne(() => Status, (status) => status.projectId)
  status: Status;
}
