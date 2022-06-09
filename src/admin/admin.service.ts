import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { DeleteAccountParamsDto } from './dto/request/delete-account.dto';
import { GetAdminListDto } from './dto/request/get-admin-list.dto';
import { GetAdminListResponseDto } from './dto/response/get-admin-list';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getAdminList(
    req: Request,
    query: GetAdminListDto,
  ): Promise<GetAdminListResponseDto> {
    const admins = await this.adminRepository.getAdminList(
      req.user.userId,
      query.page,
      query.limit,
    );
    return new GetAdminListResponseDto(admins[0], admins[1]);
  }

  async deleteChildAccount(
    req: Request,
    param: DeleteAccountParamsDto,
  ): Promise<void> {
    const requestor = await this.adminRepository.findOne({
      uuid: req.user.userId,
    });
    const target = await this.adminRepository.findOne({
      ...param,
      joinParent: true,
    });
    if (!target) throw new NotFoundException();

    if (target.parentAccount.id !== requestor.id)
      throw new ForbiddenException();

    await this.adminRepository.deleteAccount(target.id);
    await this.cacheManager.set(req.user.userId, 'DELETED', { ttl: 86400 });
  }
}
