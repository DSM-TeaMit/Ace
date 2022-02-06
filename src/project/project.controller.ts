import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { CreateProjectRequestDto } from './dto/request/create-project.dto';
import { ProjectService } from './project.service';

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
}
