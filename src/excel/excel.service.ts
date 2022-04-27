import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import * as xlsx from 'xlsx';

@Injectable()
export class ExcelService {
  async parseExcel(stream: Readable) {
    const buffer = await this.streamToBuffer(stream);
    const workbook = xlsx.read(buffer, { type: 'buffer' });

    const students: {
      studentNo: number;
      name: string;
      email: string;
      enrollYear: number;
    }[] = [];
    workbook.SheetNames.forEach((sheetName) => {
      const rowObj = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {});
      students.push(
        ...rowObj.map((obj) => ({
          studentNo: obj['학번'],
          name: obj['이름'],
          email: obj['이메일'],
          enrollYear: obj['입학년도'],
        })),
      );
    });

    return students;
  }

  async streamToBuffer(stream: Readable) {
    return new Promise<Buffer>((resolve, reject) => {
      const buffer = [];
      stream.on('error', (e) => {
        reject(e);
      });
      stream.on('data', (data) => {
        buffer.push(data);
      });
      stream.on('end', () => {
        resolve(Buffer.concat(buffer));
      });
    });
  }
}
