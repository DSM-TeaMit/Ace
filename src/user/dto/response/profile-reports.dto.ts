import { PendingProject } from './profile-main.dto';

export interface ProfileReportsDto {
  accepted: { count: number; projects: Omit<PendingProject, 'status'>[] };
  rejected: { count: number; projects: Omit<PendingProject, 'status'>[] };
  pending: { count: number; projects: Omit<PendingProject, 'status'>[] };
}
