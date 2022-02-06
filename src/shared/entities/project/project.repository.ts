import { CreateProjectRequestDto } from 'src/project/dto/request/create-project.dto';
import { ModifyProjectRequestDto } from 'src/project/dto/request/modify-project.dto';
import {
  AbstractRepository,
  Brackets,
  EntityRepository,
  getConnection,
} from 'typeorm';
import { v4 } from 'uuid';
import { Member } from '../member/member.entity';
import { Project } from './project.entity';

@EntityRepository(Project)
export class ProjectRepository extends AbstractRepository<Project> {
  async getProjectsOfUser(
    userId: number,
    isMine: boolean,
    page: number,
    limit: number,
  ) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.userId', 'userId')
      .where('members.userId = :userId', { userId })
      .orderBy('project.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit);
    if (!isMine)
      qb.leftJoinAndSelect('project.status', 'status').andWhere(
        'report.isReportAccepted = true',
      );

    return qb.getManyAndCount();
  }

  async getPendingProjects(userId?: number) {
    const qb = this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.members', 'members')
      .where(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where('status.isPlanSubmitted = true').andWhere(
                new Brackets((qb) => {
                  qb.where('status.isPlanAccepted IS NULL').orWhere(
                    'status.isPlanAccepted = false',
                  );
                }),
              );
            }),
          );
          qb.orWhere(
            new Brackets((qb) => {
              qb.where('status.isReportSubmitted = true').andWhere(
                new Brackets((qb) => {
                  qb.where('status.isReportAccepted IS NULL').orWhere(
                    'status.isReportAccepted = false',
                  );
                }),
              );
            }),
          );
        }),
      )
      .take(4);
    if (userId) qb.andWhere('members.userId = :userId', { userId });

    return qb.getManyAndCount();
  }

  async getReports(
    userId: number,
    page: number,
    limit: number,
    type: boolean | null,
  ) {
    return this.createQueryBuilder('project')
      .select()
      .leftJoinAndSelect('project.status', 'status')
      .leftJoinAndSelect('project.members', 'members')
      .where(
        new Brackets((qb) => {
          qb.where(
            new Brackets((qb) => {
              qb.where('status.isPlanSubmitted = true').andWhere(
                type !== null
                  ? 'status.isPlanAccepted = :type'
                  : 'status.isPlanAccepted IS NULL',
                { type },
              );
            }),
          );
          qb.orWhere(
            new Brackets((qb) => {
              qb.where('status.isReportSubmitted = true').andWhere(
                type !== null
                  ? 'status.isReportAccepted = :type'
                  : 'status.isReportAccepted IS NULL',
                { type },
              );
            }),
          );
        }),
      )
      .andWhere('members.userId = :userId', { userId })
      .take(limit)
      .skip(limit * (page - 1))
      .getManyAndCount();
  }

  async createProject(
    payload: CreateProjectRequestDto,
    members: {
      id: number;
      role: string;
    }[],
  ): Promise<string | undefined> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const uuid = v4();
    try {
      const projectId: number = (
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(Project)
          .values({
            uuid: uuid,
            projectName: payload.name,
            projectType: payload.type,
            field: payload.field,
          })
          .execute()
      ).identifiers[0].id;
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            projectId: () => projectId.toString(),
            userId: () => member.id.toString(),
            role: member.role,
          })),
        )
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Status)
        .values({
          projectId: () => projectId.toString(),
          isPlanSubmitted: false,
          isReportSubmitted: false,
        })
        .execute();

      await queryRunner.commitTransaction();
      return uuid;
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    }
  }

  async modifyProject(
    uuid: string,
    payload: ModifyProjectRequestDto,
    members: {
      id: number;
      role: string;
    }[],
  ): Promise<string | undefined> {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const projectId: number = (
        await queryRunner.manager
          .createQueryBuilder()
          .update(Project)
          .set({
            projectName: payload.name,
            projectType: payload.type,
            field: payload.field,
          })
          .where('project.uuid = :uuid', { uuid })
          .execute()
      ).generatedMaps[0].id;
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Member)
        .where('projectId = :projectId', { projectId })
        .execute();
      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(Member)
        .values(
          members.map((member) => ({
            projectId: () => projectId.toString(),
            userId: () => member.id.toString(),
            role: member.role,
          })),
        )
        .execute();

      await queryRunner.commitTransaction();
      return uuid;
    } catch (e) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    }
  }
}
