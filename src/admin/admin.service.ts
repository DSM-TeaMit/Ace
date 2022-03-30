import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import { DeleteAccountParamsDto } from './dto/request/delete-account.dto';
import { GetCreatedByRequestorDto } from './dto/response/get-created-by-requestor.dto';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getCreatedByRequestor(req: Request): Promise<GetCreatedByRequestorDto> {
    const requestor = await this.adminRepository.findOne({
      uuid: req.user.userId,
    });
    const accounts = await this.adminRepository.getChildAccounts(requestor.id);
    return {
      count: accounts[1],
      accounts: accounts[0].map((admin) => ({
        uuid: admin.uuid,
        uid: admin.uid,
        name: admin.name,
        emoji: admin.emoji,
      })),
    };
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
    return;
  }
}
