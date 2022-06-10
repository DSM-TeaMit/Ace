import { Exclude, Expose } from 'class-transformer';
import { ProjectResponseBase } from 'src/project/dto/response/project-response-base.dto';
import { Project } from 'src/shared/entities/project/project.entity';
import { User } from 'src/shared/entities/user/user.entity';

export class ProfileMainResponseDto
  extends ProjectResponseBase
  implements ProfileMainResponse
{
  @Exclude() private _user: User;
  @Exclude() private _projects: [Project[], number];
  @Exclude() private _pendingProjects: [Project[], number];

  constructor(
    user: User,
    projects: [Project[], number],
    pendingProjects: [Project[], number],
  ) {
    super();
    this._user = user;
    this._projects = projects;
    this._pendingProjects = pendingProjects;
  }

  @Expose()
  get studentNo() {
    return this._user.studentNo;
  }

  @Expose()
  get name() {
    return this._user.name;
  }

  @Expose()
  get email() {
    return this._user.email;
  }

  @Expose()
  get thumbnailUrl() {
    return this._user.thumbnailUrl;
  }

  @Expose()
  get githubId() {
    return this._user.githubId;
  }

  @Expose()
  get pendingCount() {
    return this._pendingProjects[1];
  }

  @Expose()
  get pendingReports() {
    return this._pendingProjects[0]?.map((project) => {
      const type =
        project.status.isPlanSubmitted && !project.status.isPlanAccepted
          ? 'PLAN'
          : 'REPORT';
      return {
        uuid: project.uuid,
        projectName: project.name,
        thumbnailUrl: project.thumbnailUrl,
        emoji: project.emoji,
        type,
        status: this.getDocumentStatus(
          project,
          type.toLowerCase() as 'plan' | 'report',
        ),
      };
    });
  }

  @Expose()
  get projectCount() {
    return this._projects[1];
  }

  @Expose()
  get projects() {
    return this._projects[0].map((project) => ({
      uuid: project.uuid,
      projectName: project.name,
      projectDescription: project.description,
      projectType: project.type,
      fields: project.field,
      thumbnailUrl: project.thumbnailUrl,
      emoji: project.emoji,
      members: project.members.map((member) => ({
        uuid: member.user.uuid,
        name: member.user.name,
        thumbnailUrl: member.user.thumbnailUrl,
      })),
    }));
  }
}

export interface ProfileMainResponse {
  studentNo: number;
  name: string;
  email: string;
  githubId?: string;
  thumbnailUrl: string;
  pendingCount: number;
  pendingReports?: ReportInfo[];
  projectCount: number;
  projects: ProjectItem[];
}

export interface ReportInfo {
  uuid: string;
  projectName: string;
  type: string;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  thumbnailUrl: string;
  emoji: string;
}

export interface ProjectItem {
  uuid: string;
  projectName: string;
  projectDescription?: string;
  projectType: string;
  fields: string;
  thumbnailUrl: string;
  emoji: string;
  members: Member[];
}

interface Member {
  uuid: string;
  name: string;
  thumbnailUrl?: string;
}
