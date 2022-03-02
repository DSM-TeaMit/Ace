export interface GetCommentResponseDto {
  count: number;
  comments: Comment[];
}

interface Comment {
  uuid: string;
  writerId: string;
  writerType: 'user' | 'admin';
  writerName: string;
  writerSno?: number;
  content: string;
  thumbnailUrl: string;
}
