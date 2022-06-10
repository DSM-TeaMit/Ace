import { Exclude, Expose } from 'class-transformer';
import { Project } from 'src/shared/entities/project/project.entity';

export class FeedResponseDto {
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
  get projects(): ProjectItem[] {
    return this._projects.map((project) => ({
      uuid: project.uuid,
      thumbnailUrl: project.thumbnailUrl,
      emoji: project.emoji,
      projectName: project.name,
      projectType: project.type,
      projectField: project.field,
      viewCount: project.viewCount,
    }));
  }
}

interface ProjectItem {
  thumbnailUrl: string;
  emoji: string;
  uuid: string;
  projectName: string;
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectField: string;
  viewCount: number;
}
