import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { ChangeGithubIdRequestDto } from './dto/request/change-github-id.dto';
import {
  ProfileEachReportRequestQueryDto,
  ProfileRequestDto,
  ProfileRequestQueryDto,
} from './dto/request/profile.dto';
import { SearchUserRequestQueryDto } from './dto/request/search-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('migrate')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('excel'))
  uploadImages(@UploadedFile() file: Express.MulterS3.File) {
    return this.userService.migrateUsers(file);
  }

  @Get('search')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async searchUser(
    @Req() req: Request,
    @Query() query: SearchUserRequestQueryDto,
  ) {
    return this.userService.searchUser(req, query);
  }

  @Delete()
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Req() req: Request) {
    return this.userService.deleteUser(req);
  }

  @Get('header')
  @UseGuards(JwtAuthGuard)
  async getHeaderInfo(@Req() req: Request) {
    return this.userService.getHeaderInfo(req);
  }

  @Get('profile')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request, @Param() payload: ProfileRequestDto) {
    return this.userService.getProfile(req, payload);
  }

  @Get('profile/projects')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getProjects(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileRequestQueryDto,
  ) {
    return this.userService.getProjects(req, param, query);
  }

  @Get('profile/reports')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getReports(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileRequestQueryDto,
  ) {
    return this.userService.getReports(req, param, query);
  }

  @Get('profile/reports/each')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getEachReports(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileEachReportRequestQueryDto,
  ) {
    return this.userService.getEachReports(req, param, query);
  }

  @Put('profile/githubId')
  @Roles(Role.User)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async changeGithubId(
    @Req() req: Request,
    @Body() payload: ChangeGithubIdRequestDto,
  ) {
    return this.userService.changeGithubId(req, payload);
  }

  @Get('profile/:uuid')
  @UseGuards(JwtAuthGuard)
  async getProfileWithUuid(
    @Req() req: Request,
    @Param() payload: ProfileRequestDto,
  ) {
    return this.userService.getProfile(req, payload);
  }

  @Get('profile/:uuid/projects')
  @UseGuards(JwtAuthGuard)
  async getProjectsWithUuid(
    @Req() req: Request,
    @Param() param: ProfileRequestDto,
    @Query() query: ProfileRequestQueryDto,
  ) {
    return this.userService.getProjects(req, param, query);
  }
}
