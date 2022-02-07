import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { CreatePlanRequestDto } from '../dto/request/create-plan.dto';
import { ModifyPlanRequestDto } from '../dto/request/modify-plan.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { PlanService } from '../services/plan.service';

@Controller('project')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post(':uuid/plan')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async createPlan(
    @Param() param: ProjectParamsDto,
    @Body() payload: CreatePlanRequestDto,
  ) {
    return this.planService.createPlan(param, payload);
  }

  @Get(':uuid/plan')
  @UseGuards(JwtAuthGuard)
  async getPlan(@Param() param: ProjectParamsDto) {
    return this.planService.getPlan(param);
  }

  @Patch(':uuid/plan')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async modifyPlan(
    @Req() req: Request,
    @Param() param: ProjectParamsDto,
    @Body() payload: ModifyPlanRequestDto,
  ) {
    return this.planService.modifyPlan(req, param, payload);
  }
}
