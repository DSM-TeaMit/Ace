export interface HeaderInfoResponseDto {
  thumbnailUrl?: string;
  emoji?: string;
  studentNo?: number;
  name: string;
  type: 'user' | 'admin';
}
