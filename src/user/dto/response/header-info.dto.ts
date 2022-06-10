import { Exclude, Expose } from 'class-transformer';
import { Admin } from 'src/shared/entities/admin/admin.entity';
import { User } from 'src/shared/entities/user/user.entity';

export class HeaderInfoResponseDto implements HeaderInfoResponse {
  @Exclude() private _admin: Admin;
  @Exclude() private _user: User;
  @Exclude() private _role: 'user' | 'admin';

  constructor(admin: Admin, user: User, role: 'user' | 'admin') {
    this._admin = admin;
    this._user = user;
    this._role = role;
  }

  @Expose()
  get thumbnailUrl() {
    return this._user?.thumbnailUrl ?? undefined;
  }

  @Expose()
  get emoji() {
    return this._admin?.emoji;
  }

  @Expose()
  get studentNo() {
    return this._user?.studentNo;
  }

  @Expose()
  get name() {
    return this._user?.name ?? this._admin?.name;
  }

  @Expose()
  get type() {
    return this._role;
  }
}

export interface HeaderInfoResponse {
  thumbnailUrl?: string;
  emoji?: string;
  studentNo?: number;
  name: string;
  type: 'user' | 'admin';
}
