export interface GetReportResponseDto {
  subject: string;
  writer: Writer;
  content: string;
}

interface Writer {
  studentNo: number;
  name: string;
}
