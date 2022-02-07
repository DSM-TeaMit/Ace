import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Project } from '../project/project.entity';

@Entity()
export class Status {
  @OneToOne(() => Project, (project) => project.status, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  projectId: Project;

  @Column()
  isPlanSubmitted: boolean;

  @Column()
  isReportSubmitted: boolean;

  @Column({ nullable: true })
  isPlanAccepted: boolean;

  @Column({ nullable: true })
  isReportAccepted: boolean;

  @Column({ nullable: true })
  plabSubmittedAt: Date;

  @Column({ nullable: true })
  reportSubmittedAt: Date;
}
