export interface LoginResponseDto {
  type?: 'registration' | 'login';
  studentNo?: number;
  name: string;
  userType: 'user' | 'admin';
  accessToken: string;
  refreshToken?: string;
  uuid?: string;
}
