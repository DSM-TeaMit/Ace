export interface LoginResponseDto {
  type?: 'registration' | 'login';
  accessToken: string;
  refreshToken?: string;
}
