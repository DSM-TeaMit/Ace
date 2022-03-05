import { Injectable } from '@nestjs/common';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FeedRequestDto } from '../dto/request/feed.dto';
import { SearchRequestDto } from '../dto/request/search.dto';
import { FeedResponseDto } from '../dto/response/feed.dto';
import { PendingProjectDto } from '../dto/response/pending-project.dto';

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

  async getPendingProjects(
    query: Omit<FeedRequestDto, 'order'>,
  ): Promise<PendingProjectDto> {
    const projects = await this.projectRepository.getPendingProjects(query);

    return {
      count: projects[1],
      projects: projects[0].map((project) => {
        const { status } = project;
        const isPlanOrReport =
          status.isPlanSubmitted === true && status.isPlanAccepted !== true
            ? 'plan'
            : 'report';
        return {
          projectName: project.projectName,
          projectType: project.projectType,
          reportType: isPlanOrReport.toUpperCase() as 'PLAN' | 'REPORT',
          submittedAt: project.status[`${isPlanOrReport}SubmittedAt`],
          writer: {
            studentNo: project.writerId.studentNo,
            name: project.writerId.name,
          },
        };
      }),
    };
  }
}
