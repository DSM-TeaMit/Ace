export interface GetReportResponseDto {
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  requestorType: 'USER_NON_EDITABLE' | 'USER_EDITABLE' | 'ADMIN';
  subject: string;
  writer: Writer;
  content: string;
}

interface Writer {
  studentNo: number;
  name: string;
}
