import { CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/user/user.entity';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { UserService } from './user.service';

const mockRepository = () => ({
  searchUser: jest.fn(),
});
const mockCache = () => ({
  get: jest.fn(),
  del: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: Record<keyof UserRepository, jest.Mock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserRepository),
          useValue: mockRepository(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCache(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(UserRepository));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchUser', () => {
    it('should return an empty array', async () => {
      userRepository.searchUser.mockResolvedValue([]);
      expect(await service.searchUser({ name: 'test user' })).toEqual({
        students: [],
      });
      expect(userRepository.searchUser).toHaveBeenNthCalledWith(1, {
        name: 'test user',
      });
    });

    it('should return a user array', async () => {
      const mockUser: User = {
        id: 1,
        uuid: 'uuid',
        email: 'email@example.com',
        name: 'test user',
        studentNo: 3101,
        githubId: null,
        thumbnailUrl: null,
        deleted: false,
        projects: [],
        members: [],
        comments: [],
      };
      userRepository.searchUser.mockResolvedValue([mockUser]);
      expect(await service.searchUser({ name: 'test user' })).toEqual({
        students: [
          {
            studentNo: 3101,
            name: 'test user',
          },
        ],
      });
      expect(userRepository.searchUser).toHaveBeenNthCalledWith(1, {
        name: 'test user',
      });
    });
  });
});
