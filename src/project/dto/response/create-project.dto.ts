import { Exclude, Expose } from 'class-transformer';

export class CreateProjectResponseDto {
  @Exclude() private _uuid: string;

  constructor(uuid: string) {
    this._uuid = uuid;
  }

  @Expose()
  get uuid() {
    return this._uuid;
  }
}
