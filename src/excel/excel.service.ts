import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

@Injectable()
export class ExcelService {

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
