import { Exclude } from 'class-transformer';
import { ReportInfo } from './profile-main.dto';

type ProjectItem = [
  {
    uuid: string;
    projectname: string;
    thumbnailurl?: string;
    emoji: string;
    type: 'PLAN' | 'REPORT';
    isplansubmitted: boolean;
    isplanaccepted: boolean;
    isreportsubmitted: boolean;
    isreportaccepted: boolean;
  }[],
  number,
];
export class ProfileReportsResponseDto
  implements Partial<ProfileReportsResponse>
{
  @Exclude() private _projects: ProjectItem[];
  @Exclude() private _type:
    | 'NOT_SUBMITTED'
    | 'PENDING'
    | 'ACCEPTED'
    | 'REJECTED';
  @Exclude() private getDocumentStatus(
    project: {
      isplansubmitted: boolean;
      isplanaccepted: boolean;
      isreportsubmitted: boolean;
      isreportaccepted: boolean;
    },
    type: 'plan' | 'report',
  ) {
    if (type === 'plan') {
      if (!project.isplansubmitted && project.isplanaccepted === null)
        return 'NOT_SUBMITTED';
      if (project.isplansubmitted && project.isplanaccepted === null)
        return 'PENDING';
      if (project.isplanaccepted) return 'ACCEPTED';
      if (!project.isplansubmitted && !project.isplanaccepted)
        return 'REJECTED';
    }
    if (type === 'report') {
      if (!project.isreportsubmitted && project.isreportaccepted === null)
        return 'NOT_SUBMITTED';
      if (project.isreportsubmitted && project.isreportaccepted === null)
        return 'PENDING';
      if (project.isreportaccepted) return 'ACCEPTED';
      if (!project.isreportsubmitted && !project.isreportaccepted)
        return 'REJECTED';
    }
  }
  @Exclude() private ReportMapper(project: ProjectItem) {
    return {
      count: project[1],
      reports: project[0].map((project) => {
        return {
          uuid: project.uuid,
          projectName: project.projectname,
          thumbnailUrl: project.thumbnailurl,
          status: this.getDocumentStatus(
            project,
            project.type.toLowerCase() as 'plan' | 'report',
          ) as 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED',
          emoji: project.emoji,
          type: project.type,
        };
      }),
    };
  }

  constructor(
    projects: ProjectItem[],
    type?: 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED',
  ) {
    this._projects = projects;
    this._type = type;
  }

  get ACCEPTED() {
    if (this._type === undefined || this._type === 'ACCEPTED')
      return this.ReportMapper(this._projects[0]);
  }

  get REJECTED() {
    if (this._type === undefined) return this.ReportMapper(this._projects[1]);
    if (this._type === 'REJECTED') return this.ReportMapper(this._projects[0]);
  }

  get PENDING() {
    if (this._type === undefined) return this.ReportMapper(this._projects[2]);
    if (this._type === 'PENDING') return this.ReportMapper(this._projects[0]);
  }

  get NOT_SUBMITTED() {
    if (this._type === undefined) return this.ReportMapper(this._projects[3]);
    if (this._type === 'NOT_SUBMITTED')
      return this.ReportMapper(this._projects[0]);
  }
}

interface ProjectBlock {
  count: number;
  reports: ReportInfo[];
}

export interface ProfileReportsResponse {
  ACCEPTED: ProjectBlock;
  REJECTED: ProjectBlock;
  PENDING: ProjectBlock;
  NOT_SUBMITTED: ProjectBlock;
}
