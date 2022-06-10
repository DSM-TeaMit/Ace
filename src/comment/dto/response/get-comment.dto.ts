import { Exclude, Expose } from 'class-transformer';
import { Comment } from 'src/shared/entities/comment/comment.entity';

export class GetCommentResponseDto {
  @Exclude() private _comments: Comment[];
  @Exclude() private _count: number;
  @Exclude() private _uuid: string;

  constructor(comments: Comment[], count: number, uuid: string) {
    this._comments = comments;
    this._count = count;
    this._uuid = uuid;
  }

  @Expose()
  get count() {
    return this._count;
  }

  @Expose()
  get comments(): CommentItem[] {
    return this._comments.map((comment) => ({
      uuid: comment.uuid,
      writerId: comment.admin?.uuid ?? comment.user?.uuid,
      writerType: comment.admin ? 'admin' : 'user',
      writerName: comment.admin?.name ?? comment.user?.name,
      writerSno: comment.user?.studentNo,
      isMine: (comment.admin?.uuid ?? comment.user?.uuid) === this._uuid,
      content: comment.content,
      thumbnailUrl:
        comment.admin?.thumbnailUrl ?? comment.user?.thumbnailUrl ?? undefined,
      emoji: comment.admin?.emoji,
    }));
  }
}

interface CommentItem {
  uuid: string;
  writerId: string;
  writerType: 'user' | 'admin';
  writerName: string;
  writerSno?: number;
  isMine: boolean;
  content: string;
  thumbnailUrl?: string;
  emoji?: string;
}
