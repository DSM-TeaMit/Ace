export interface GoogleAuthTokenResponseDto {
  type: 'registration' | 'login';
  accessToken: string;
  refreshToken?: string;
}
