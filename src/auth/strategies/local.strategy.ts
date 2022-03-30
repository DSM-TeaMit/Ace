import { UnauthorizedException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { Strategy } from 'passport-local';
import { AdminRepository } from 'src/shared/entities/admin/admin.repository';
import 'dotenv/config';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly adminRepository: AdminRepository) {
    super({
      usernameField: 'id',
    });
  }

  async validate(id: string, password: string) {
    const user = await this.adminRepository.findOne({ uid: id });
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException();
    return { userId: user.uuid, userInfo: user };
  }
}
