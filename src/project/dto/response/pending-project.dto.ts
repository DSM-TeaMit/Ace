import { Exclude, Expose } from 'class-transformer';
import { Project } from 'src/shared/entities/project/project.entity';

export class PendingProjectsResponseDto {
  @Exclude() private _count: number;
  @Exclude() private _projects: Project[];

  constructor(projects: Project[], count: number) {
    this._projects = projects;
    this._count = count;
  }

  @Expose()
  get count() {
    return this._count;
  }

  @Expose()
  get reports(): ProjectItem[] {
    return this._projects.map((project) => {
      const { status } = project;
      const isPlanOrReport =
        status.isPlanSubmitted === true && status.isPlanAccepted !== true
          ? 'plan'
          : 'report';
      return {
        uuid: project.uuid,
        projectName: project.name,
        projectType: project.type,
        reportType: isPlanOrReport.toUpperCase() as 'PLAN' | 'REPORT',
        submittedAt: project.status[`${isPlanOrReport}SubmittedAt`],
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
        writer: {
          studentNo: project.writer.studentNo,
          name: project.writer.name,
        },
      };
    });
  }
}

export interface ProjectItem {
  uuid: string;
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  reportType: 'PLAN' | 'REPORT';
  submittedAt: Date;
  thumbnailUrl: string;
  emoji: string;
  writer: {
    studentNo: number;
    name: string;
  };
}
