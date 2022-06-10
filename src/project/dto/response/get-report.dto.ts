import { Exclude, Expose } from 'class-transformer';
import { RequestorType } from 'src/project/types';
import { Report } from 'src/shared/entities/report/report.entity';
import { ProjectResponseBase } from './project-response-base.dto';

export class GetReportResponseDto
  extends ProjectResponseBase
  implements GetReportResponse
{
  @Exclude() private _report: Report;
  @Exclude() private _requestorType: RequestorType;

  constructor(report: Report, requestorType: RequestorType) {
    super();
    this._report = report;
    this._requestorType = requestorType;
  }

  @Expose()
  get projectType() {
    return this._report.project.type;
  }

  @Expose()
  get projectName() {
    return this._report.project.name;
  }

  @Expose()
  get requestorType() {
    return this._requestorType;
  }

  @Expose()
  get status() {
    return this.getDocumentStatus(this._report.project, 'report');
  }

  @Expose()
  get subject() {
    return this._report.subject;
  }

  @Expose()
  get writer() {
    return {
      studentNo: this._report.project.writer.studentNo,
      name: this._report.project.writer.name,
    };
  }

  @Expose()
  get content() {
    return this._report.content;
  }
}

export interface GetReportResponse {
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  projectName: string;
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  status: 'NOT_SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  subject: string;
  writer: Writer;
  content: string;
}

interface Writer {
  studentNo: number;
  name: string;
}
