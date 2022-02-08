declare namespace Express {
  export interface User {
    email?: string;
    githubToken?: string;
    userId: string;
    role: 'user' | 'admin';
  }
}
