import { Injectable } from '@nestjs/common';
import { Project } from 'src/shared/entities/project/project.entity';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FeedRequestDto } from '../dto/request/feed.dto';
import {
  SearchRequestDto,
  SearchTypeRequestDto,
} from '../dto/request/search.dto';
import { FeedSearchResponseDto } from '../dto/response/feed-search.dto';
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
        uuid: project.uuid,
        thumbnailUrl: project.thumbnailUrl,
        projectName: project.projectName,
        projectType: project.projectType,
        projectField: project.field,
        viewCount: project.viewCount,
      })),
    };
  }

  async search(query: SearchRequestDto): Promise<FeedSearchResponseDto> {
    const projects = await Promise.all([
      this.projectRepository.search(query),
      this.projectRepository.searchByMember(query),
    ]);

    return {
      projectName: {
        count: projects[0][1],
        projects: projects[0][0].map((project) => ({
          uuid: project.uuid,
          thumbnailUrl: project.thumbnailUrl,
          projectName: project.projectName,
          projectType: project.projectType,
          projectField: project.field,
          viewCount: project.viewCount,
        })),
      },
      memberName: {
        count: projects[1][1],
        projects: projects[1][0].map((project) => ({
          uuid: project.uuid,
          thumbnailUrl: project.thumbnailUrl,
          projectName: project.projectName,
          projectType: project.projectType,
          projectField: project.field,
          viewCount: project.viewCount,
        })),
      },
    };
  }

  async searchEach(
    query: SearchTypeRequestDto,
  ): Promise<Partial<FeedSearchResponseDto>> {
    const projects: [Project[], number] = await this.projectRepository[
      { projectName: 'search', memberName: 'searchByMember' }[query.searchBy]
    ](query);

    return {
      [query.searchBy]: {
        count: projects[1],
        projects: projects[0].map((project) => ({
          uuid: project.uuid,
          thumbnailUrl: project.thumbnailUrl,
          projectName: project.projectName,
          projectType: project.projectType,
          projectField: project.field,
          viewCount: project.viewCount,
        })),
      },
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
          uuid: project.uuid,
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
