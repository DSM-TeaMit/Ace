import { ReportInfo } from './profile-main.dto';

interface ProjectBlock {
  count: number;
  reports: ReportInfo[];
}

export interface ProfileReportsDto {
  ACCEPTED: ProjectBlock;
  REJECTED: ProjectBlock;
  PENDING: ProjectBlock;
  NOT_SUBMITTED: ProjectBlock;
}
