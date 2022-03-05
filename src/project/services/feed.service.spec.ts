import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { FeedService } from './feed.service';

const mockRepository = (): Partial<
  Record<keyof ProjectRepository, jest.Mock>
> => ({
  getPendingProjects: jest.fn(),
});

describe('ProjectService', () => {
  let service: FeedService;
  let projectRepository: Record<keyof ProjectRepository, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(ProjectRepository),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    projectRepository = module.get(getRepositoryToken(ProjectRepository));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPendingProjects', () => {
    it('should return an empty array', async () => {
      projectRepository.getPendingProjects.mockResolvedValue([[], 0]);
      expect(await service.getPendingProjects({ page: 1, limit: 8 })).toEqual({
        count: 0,
        projects: [],
      });
      expect(projectRepository.getPendingProjects).toHaveBeenNthCalledWith(1, {
        page: 1,
        limit: 8,
      });
    });

    it('should return a project array', async () => {
      const date = new Date();
      projectRepository.getPendingProjects.mockResolvedValue([
        [
          {
            id: 1,
            uuid: 'uuid',
            projectName: 'test project',
            projectType: 'PERS',
            writerId: {
              studentNo: 3400,
              name: 'test user',
            },
            status: {
              isPlanSubmitted: true,
              isPlanAccepted: null,
              isReportSubmitted: false,
              isReportAccepted: null,
              planSubmittedAt: date,
              reportSubmittedAt: null,
            },
          },
        ],
        1,
      ]);
      expect(await service.getPendingProjects({ page: 1, limit: 8 })).toEqual({
        count: 1,
        projects: [
          {
            projectName: 'test project',
            projectType: 'PERS',
            reportType: 'PLAN',
            submittedAt: date,
            writer: {
              studentNo: 3400,
              name: 'test user',
            },
          },
        ],
      });
      expect(projectRepository.getPendingProjects).toHaveBeenNthCalledWith(1, {
        page: 1,
        limit: 8,
      });
    });
    it('should return a project array', async () => {
      const date = new Date();
      projectRepository.getPendingProjects.mockResolvedValue([
        [
          {
            id: 1,
            uuid: 'uuid',
            projectName: 'test project',
            projectType: 'PERS',
            writerId: {
              studentNo: 3400,
              name: 'test user',
            },
            status: {
              isPlanSubmitted: true,
              isPlanAccepted: true,
              isReportSubmitted: true,
              isReportAccepted: null,
              planSubmittedAt: date,
              reportSubmittedAt: date,
            },
          },
        ],
        1,
      ]);
      expect(await service.getPendingProjects({ page: 1, limit: 8 })).toEqual({
        count: 1,
        projects: [
          {
            projectName: 'test project',
            projectType: 'PERS',
            reportType: 'REPORT',
            submittedAt: date,
            writer: {
              studentNo: 3400,
              name: 'test user',
            },
          },
        ],
      });
      expect(projectRepository.getPendingProjects).toHaveBeenNthCalledWith(1, {
        page: 1,
        limit: 8,
      });
    });
  });
});
