export interface GetReportResponseDto {
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
