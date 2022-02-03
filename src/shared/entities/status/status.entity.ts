import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Project } from '../project/project.entity';

@Entity()
export class Status {
  @OneToOne(() => Project, (project) => project.status, { primary: true })
  @JoinColumn()
  projectId: Project;

  @Column()
  isPlanSubmitted: boolean;

  @Column()
  isReportSubmitted: boolean;

  @Column()
  isPlanAccepted: boolean;

  @Column()
  isReportAccepted: boolean;

  @Column()
  plabSubmittedAt: Date;

  @Column()
  reportSubmittedAt: Date;
}
