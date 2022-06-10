import { Project } from 'src/shared/entities/project/project.entity';
import { Status } from 'src/shared/entities/status/status.entity';

export class ProjectResponseBase {
  protected getProjectStatus(status: Status) {
    if (!status.isPlanSubmitted) return 'PLANNING';
    if (status.isPlanSubmitted && status.isPlanAccepted === null)
      return 'PENDING(PLAN)';
    if (status.isPlanAccepted && !status.isReportSubmitted) return 'REPORTING';
    if (status.isReportSubmitted && status.isReportAccepted === null)
      return 'PENDING(REPORT)';
    if (status.isReportAccepted) return 'DONE';
  }

  protected getDocumentStatus(
    project: Project,
    type: 'plan' | 'report',
  ): 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED' {
    if (type === 'plan') {
      if (
        !project.status.isPlanSubmitted &&
        project.status.isPlanAccepted === null
      )
        return 'NOT_SUBMITTED';
      if (
        project.status.isPlanSubmitted &&
        project.status.isPlanAccepted === null
      )
        return 'PENDING';
      if (project.status.isPlanAccepted) return 'ACCEPTED';
      if (!project.status.isPlanSubmitted && !project.status.isPlanAccepted)
        return 'REJECTED';
    }
    if (type === 'report') {
      if (
        !project.status.isReportSubmitted &&
        project.status.isReportAccepted === null
      )
        return 'NOT_SUBMITTED';
      if (
        project.status.isReportSubmitted &&
        project.status.isReportAccepted === null
      )
        return 'PENDING';
      if (project.status.isReportAccepted) return 'ACCEPTED';
      if (!project.status.isReportSubmitted && !project.status.isReportAccepted)
        return 'REJECTED';
    }
  }
}
