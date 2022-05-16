import { Exclude, Expose } from 'class-transformer';
import { Admin } from 'src/shared/entities/admin/admin.entity';
import { User } from 'src/shared/entities/user/user.entity';

export class LoginResponseDto {
  @Exclude() private _user: { uuid: string; studentNo?: number; name: string };
  @Exclude() private _accessToken: string;
  @Exclude() private _refreshToken: string;

  constructor(
    user: { uuid: string; studentNo?: number; name: string },
    accessToken: string,
    refreshToken: string,
  ) {
    this._user = user;
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
  }

  @Expose()
  get uuid() {
    return this._user.uuid;
  }

  @Expose()
  get studentNo() {
    return this._user.studentNo;
  }

  @Expose()
  get name() {
    return this._user.name;
  }

  @Expose()
  get userType() {
    if (this._user instanceof User) return 'user';
    if (this._user instanceof Admin) return 'admin';
  }

  @Expose()
  get accessToken() {
    return this._accessToken;
  }

  @Expose()
  get refreshToken() {
    return this._refreshToken;
  }
}
