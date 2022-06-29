import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { ReportService } from '../services/report.service';

@Controller('project')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get(':uuid/report')
  @UseGuards(JwtAuthGuard)
  async getReport(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.reportService.getReport(req, param);
  }

  @Delete(':uuid/report')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteReport(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.reportService.deleteReport(req, param);
  }

  @Patch(':uuid/report/submit')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async submitReport(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.reportService.submitReport(req, param);
  }
}
