export interface GetReportResponseDto {
  projectType: 'PERS' | 'TEAM' | 'CLUB';
  subject: string;
  writer: Writer;
  content: string;
}

interface Writer {
  studentNo: number;
  name: string;
}
