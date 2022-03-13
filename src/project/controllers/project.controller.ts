import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ConfirmProjectQueryDto } from '../dto/request/confirm-project.dto';
import { CreateProjectRequestDto } from '../dto/request/create-project.dto';
import { ModifyProjectRequestDto } from '../dto/request/modify-project.dto';
import { ProjectParamsDto } from '../dto/request/project-params.dto';
import { ProjectService } from '../services/project.service';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  createProject(@Req() req: Request, @Body() payload: CreateProjectRequestDto) {
    return this.projectService.createProject(req, payload);
  }

  @Get(':uuid')
  @UseGuards(JwtAuthGuard)
  getProject(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.projectService.getProject(req, param);
  }

  @Patch(':uuid')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  modifyProject(
    @Req() req: Request,
    @Param() param: ProjectParamsDto,
    @Body() payload: ModifyProjectRequestDto,
  ) {
    return this.projectService.modifyProject(req, param, payload);
  }

  @Delete(':uuid')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  deleteProject(@Req() req: Request, @Param() param: ProjectParamsDto) {
    return this.projectService.deleteProject(req, param);
  }

  @Patch(':uuid/confirm')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async confirmPlan(
    @Req() req,
    @Param() param: ProjectParamsDto,
    @Query() query: ConfirmProjectQueryDto,
  ) {
    return this.projectService.confirmProject(req, param, query);
  }
}
