declare namespace Express {
  export interface User {
    email?: string;
    picture?: string;
    hd?: string;
    githubToken?: string;
    githubId?: string;
    userId: string;
    userInfo: any;
    role: 'user' | 'admin';
  }
}
