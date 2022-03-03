declare namespace Express {
  export interface User {
    email?: string;
    githubToken?: string;
    githubId?: string;
    userId: string;
    userInfo: Record<string, any>;
    role: 'user' | 'admin';
  }
}
