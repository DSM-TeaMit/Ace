import { Exclude, Expose } from 'class-transformer';
import { Admin } from 'src/shared/entities/admin/admin.entity';

export class GetAdminListResponseDto {
  @Exclude() private _count: number;
  @Exclude() private _admins: Admin[];

  constructor(admins: Admin[], count: number) {
    this._count = count;
    this._admins = admins;
  }

  @Expose()
  get count(): number {
    return this._count;
  }

  @Expose()
  get accounts(): Account[] {
    return this._admins.map((admin) => ({
      uuid: admin.uuid,
      uid: admin.uid,
      name: admin.name,
      emoji: admin.emoji,
    }));
  }
}

interface Account {
  uuid: string;
  uid: string;
  name: string;
  emoji: string;
}
