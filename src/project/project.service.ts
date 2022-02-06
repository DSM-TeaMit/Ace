import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Request } from 'express';
import { ProjectRepository } from 'src/shared/entities/project/project.repository';
import { UserRepository } from 'src/shared/entities/user/user.repository';
import { CreateProjectRequestDto } from './dto/request/create-project.dto';
import { CreateProjectResponseDto } from './dto/response/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createProject(
    req: Request,
    payload: CreateProjectRequestDto,
  ): Promise<CreateProjectResponseDto> {
    if (!payload.members.map((member) => member.uuid).includes(req.user.userId))
      throw new UnprocessableEntityException();
    const members: {
      id: number;
      role: string;
    }[] = [];
    for await (const member of payload.members) {
      const user = await this.userRepository.findOneByUuid(member.uuid);
      if (!user) throw new UnprocessableEntityException();
      members.push({
        id: user.id,
        role: member.role,
      });
    }

    return {
      uuid: await this.projectRepository.createProject(payload, members),
    };
  }
}
