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
import { PlanService } from '../services/plan.service';

@Controller('project')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get(':uuid/plan')
  @UseGuards(JwtAuthGuard)
  async getPlan(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.planService.getPlan(req, param);
  }

  @Delete(':uuid/plan')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deletePlan(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.planService.deletePlan(req, param);
  }

  @Patch(':uuid/plan/submit')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async submitPlan(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.planService.submitPlan(req, param);
  }
}
