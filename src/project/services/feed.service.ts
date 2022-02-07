import { Injectable } from '@nestjs/common';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FeedRequestDto } from '../dto/request/feed.dto';
import { SearchRequestDto } from '../dto/request/search.dto';
import { FeedResponseDto } from '../dto/response/feed.dto';

@Injectable()
export class FeedService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async getFeed(query: FeedRequestDto): Promise<FeedResponseDto> {
    const projects = await this.projectRepository.getDoneProjects(
      query.page,
      query.limit,
      { [query.order]: true },
    );

    return {
      count: projects[1],
      projects: projects[0].map((project) => ({
        thumbnailUrl: project.thumbnailUrl,
        projectName: project.projectName,
        projectType: project.projectType,
        projectField: project.field,
        viewCount: project.viewCount,
      })),
    };
  }

  async search(query: SearchRequestDto): Promise<FeedResponseDto> {
    const projects = await this.projectRepository.search(query);

    return {
      count: projects[1],
      projects: projects[0].map((project) => ({
        thumbnailUrl: project.thumbnailUrl,
        projectName: project.projectName,
        projectType: project.projectType,
        projectField: project.field,
        viewCount: project.viewCount,
      })),
    };
  }
}
