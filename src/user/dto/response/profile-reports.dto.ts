import { ReportInfo } from './profile-main.dto';

interface ProjectBlock {
  count: number;
  projects: ReportInfo[];
}

export interface ProfileReportsDto {
  accepted: ProjectBlock;
  rejected: ProjectBlock;
  pending: ProjectBlock;
  writing: ProjectBlock;
}
