import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AdminRepository])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
