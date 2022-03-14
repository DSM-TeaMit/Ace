import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { connectionOptions } from './ormconfig';
import { Admin } from './shared/entities/admin/admin.entity';
import { Comment } from './shared/entities/comment/comment.entity';
import { Member } from './shared/entities/member/member.entity';
import { Plan } from './shared/entities/plan/plan.entity';
import { Project } from './shared/entities/project/project.entity';
import { Report } from './shared/entities/report/report.entity';
import { Status } from './shared/entities/status/status.entity';
import { User } from './shared/entities/user/user.entity';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { FileModule } from './file/file.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...connectionOptions[process.env.NODE_ENV],
      entities: [Admin, Comment, Member, Plan, Project, Report, Status, User],
      namingStrategy: new SnakeNamingStrategy(),
    }),
    AdminModule,
    AuthModule,
    FileModule,
    ProjectModule,
    UserModule,
    CommentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
