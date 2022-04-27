import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from 'src/shared/entities/user/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserRepository])],
})
export class ExcelModule {}
