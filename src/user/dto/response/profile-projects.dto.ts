import { Exclude, Expose } from 'class-transformer';
import { Project } from 'src/shared/entities/project/project.entity';
import { ProjectItem } from './profile-main.dto';

export class ProfileProjectsResponseDto implements ProfileProjectsResponse {
  @Exclude() private _projects: [Project[], number];

  constructor(projects: [Project[], number]) {
    this._projects = projects;
  }

  @Expose()
  get count() {
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
export interface ProfileProjectsResponse {
  count: number;
  projects: ProjectItem[];
}
