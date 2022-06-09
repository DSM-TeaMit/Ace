import { Exclude, Expose } from 'class-transformer';
import { FeedResponseDto } from './feed.dto';

export class FeedSearchResponseDto {
  @Exclude() private _projectName: FeedResponseDto;
  @Exclude() private _memberName: FeedResponseDto;

  constructor({
    projectName,
    memberName,
  }: {
    projectName?: FeedResponseDto;
    memberName?: FeedResponseDto;
  }) {
    this._projectName = projectName;
    this._memberName = memberName;
  }

  @Expose()
  get projectName() {
    return this._projectName;
  }

  @Expose()
  get memberName() {
    return this._memberName;
  }
}
