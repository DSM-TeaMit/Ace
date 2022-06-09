import { Injectable } from '@nestjs/common';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FeedRequestDto } from '../dto/request/feed.dto';
import {
  SearchRequestDto,
  SearchTypeRequestDto,
} from '../dto/request/search.dto';
import { FeedSearchResponseDto } from '../dto/response/feed-search.dto';
import { FeedResponseDto } from '../dto/response/feed.dto';
import { PendingProjectsResponseDto } from '../dto/response/pending-project.dto';

@Injectable()
export class FeedService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async getFeed(query: FeedRequestDto): Promise<FeedResponseDto> {
    const projects = await this.projectRepository.getDoneProjects(
      query.page,
      query.limit,
      { [query.order]: true },
    );

    return new FeedResponseDto(projects[0], projects[1]);
  }

  async search(query: SearchRequestDto): Promise<FeedSearchResponseDto> {
    const projects = await Promise.all([
      this.projectRepository.search({ ...query, searchBy: 'projectName' }),
      this.projectRepository.search({ ...query, searchBy: 'memberName' }),
    ]);

    return new FeedSearchResponseDto({
      projectName: new FeedResponseDto(projects[0][0], projects[0][1]),
      memberName: new FeedResponseDto(projects[1][0], projects[1][1]),
    });
  }

  async searchEach(
    query: SearchTypeRequestDto,
  ): Promise<Partial<FeedSearchResponseDto>> {
    const projects = await this.projectRepository.search(query);
    return new FeedSearchResponseDto({
      [query.searchBy]: new FeedResponseDto(projects[0], projects[1]),
    });
  }

  async getPendingProjects(
    query: Omit<FeedRequestDto, 'order'>,
  ): Promise<PendingProjectsResponseDto> {
    const projects = await this.projectRepository.getPendingProjects(query);

    return new PendingProjectsResponseDto(projects[0], projects[1]);
  }
}
