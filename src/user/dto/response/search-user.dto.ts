import { Exclude, Expose } from 'class-transformer';
import { User } from 'src/shared/entities/user/user.entity';

export class SearchUserResponseDto implements SearchUserResponse {
  @Exclude() private _users: User[];

  constructor(users: User[]) {
    this._users = users;
  }

  @Expose()
  get students() {
    return this._users.map((user) => ({
      uuid: user.uuid,
      studentNo: user.studentNo,
      name: user.name,
    }));
  }
}

interface SearchUserResponse {
  students: Student[];
}

interface Student {
  uuid: string;
  studentNo: number;
  name: string;
}
