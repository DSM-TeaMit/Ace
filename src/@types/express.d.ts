declare namespace Express {
  export interface User {
    email?: string;
    githubToken?: string;
    githubId?: string;
    userId: string;
    role: 'user' | 'admin';
  }
}
