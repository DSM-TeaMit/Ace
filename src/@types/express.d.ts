declare namespace Express {
  import { Admin } from 'src/shared/entities/admin/admin.entity';
  export interface User {
    email?: string;
    githubToken?: string;
    githubId?: string;
    userId: string;
    userInfo: any;
    role: 'user' | 'admin';
  }
}
