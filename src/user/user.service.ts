import {
  CACHE_MANAGER,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { RegisterUserRequestDto } from './dto/request/register-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly userRepository: UserRepository,
  ) {}

  async register(req: Request, payload: RegisterUserRequestDto) {
    if (payload.githubId) {
      if (await this.cacheManager.get(req.user.email))
        throw new NotFoundException();
      await this.cacheManager.del(req.user.email);
    }
    if (await this.userRepository.findOne(req.user.email))
      throw new ConflictException();
    await this.userRepository.insert({
      ...payload,
      email: req.user.email,
    });
    return;
  }
}
