import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { AdminService } from './admin.service';
import { DeleteAccountParamsDto } from './dto/request/delete-account.dto';
import { GetAdminListDto } from './dto/request/get-admin-list.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('list')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getAdminList(@Req() req: Request, @Query() query: GetAdminListDto) {
    return this.adminService.getAdminList(req, query);
  }

  @Delete(':uuid')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteChildAccount(
    @Req() req: Request,
    @Param() param: DeleteAccountParamsDto,
  ) {
    return this.adminService.deleteChildAccount(req, param);
  }
}
