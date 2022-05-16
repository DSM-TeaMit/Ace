export interface JwtPayload {
  sub: string;
  role: 'user' | 'admin';
  picture?: string;
}
