export interface JwtPayload {
  sub: string;
  role: 'user' | 'admin';
  registrationOnly: boolean;
  picture?: string;
}
