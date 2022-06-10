import { Exclude, Expose } from 'class-transformer';
import { RequestorType, ProjectStatus } from 'src/project/types';
import { Plan } from 'src/shared/entities/plan/plan.entity';
import { Project } from 'src/shared/entities/project/project.entity';
import { Report } from 'src/shared/entities/report/report.entity';
import { ReportInfo } from 'src/user/dto/response/profile-main.dto';
import { ProjectResponseBase } from './project-response-base.dto';

export class GetProjectResponseDto
  extends ProjectResponseBase
  implements GetProjectResponse
{
  @Exclude() private _project: Project;
  @Exclude() private _plan?: Plan;
  @Exclude() private _report?: Report;
  @Exclude() private _requestorType: RequestorType;
  @Exclude() private _status: ProjectStatus;

  constructor(
    project: Project,
    requestorType: RequestorType,
    status: ProjectStatus,
  ) {
    super();
    this._project = project;
    this._plan = project.plan;
    this._report = project.report;
    this._requestorType = requestorType;
    this._status = status;
  }

  @Expose()
  get uuid() {
    return this._project.uuid;
  }

  @Expose()
  get projectName() {
    return this._project.name;
  }

  @Expose()
  get projectDescription() {
    return this._project.description;
  }

  @Expose()
  get projectView() {
    return this._project.viewCount;
  }

  @Expose()
  get projectType() {
    return this._project.type;
  }

  @Expose()
  get projectField() {
    return this._project.field;
  }

  @Expose()
  get projectStatus() {
    return this._status;
  }

  @Expose()
  get projectResult() {
    return this._project.result;
  }

  @Expose()
  get thumbnailUrl() {
    return this._project.thumbnailUrl;
  }

  @Expose()
  get emoji() {
    return this._project.emoji;
  }

  @Expose()
  get requestorType() {
    return this._requestorType;
  }

  @Expose()
  get members(): Member[] {
    return this._project.members.map((member) => ({
      uuid: member.user.uuid,
      studentNo: member.studentNo,
      name: member.user.name,
      role: member.role,
      thumbnailUrl: member.user.thumbnailUrl,
    }));
  }

  @Expose()
  get plan() {
    return this._plan
      ? {
          uuid: this._project.uuid,
          projectName: this._project.name,
          type: 'plan',
          status: this.getDocumentStatus(this._project, 'plan'),
          thumbnailUrl: this._project.thumbnailUrl,
          emoji: this._project.emoji,
        }
      : undefined;
  }

  @Expose()
  get report() {
    return this._report
      ? {
          uuid: this._project.uuid,
          projectName: this._project.name,
          type: 'report',
          status: this.getDocumentStatus(this._project, 'report'),
          thumbnailUrl: this._project.thumbnailUrl,
          emoji: this._project.emoji,
        }
      : undefined;
  }
}

interface GetProjectResponse {
  uuid: string;
  projectName: string;
  projectDescription: string;
  projectView: number;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  projectStatus: string;
  projectResult: string;
  thumbnailUrl: string;
  emoji: string;
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  members: Member[];
  plan?: ReportInfo;
  report?: ReportInfo;
}

interface Member {
  thumbnailUrl?: string;
  uuid: string;
  studentNo: number;
  name: string;
  role: string;
}
