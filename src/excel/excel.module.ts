import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { ExcelService } from './excel.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRepository])],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
