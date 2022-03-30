import { PendingProject } from './profile-main.dto';

interface ProjectBlock {
  count: number;
  projects: Omit<PendingProject, 'status'>[];
}

export interface ProfileReportsDto {
  accepted: ProjectBlock;
  rejected: ProjectBlock;
  pending: ProjectBlock;
  writing: ProjectBlock;
}
