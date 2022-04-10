import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../comment/comment.entity';
import { Member } from '../member/member.entity';
import { Project } from '../project/project.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 36 })
  @Index({ where: '"deleted" = false' })
  uuid: string;

  @Column({ length: 40, unique: true })
  email: string;

  @Column({ length: 6 })
  name: string;

  @Column()
  studentNo: number;

  @Column({ length: 20, nullable: true })
  githubId: string;

  @Column({ length: 200, nullable: true })
  thumbnailUrl: string;

  @Column({ default: false })
  deleted: boolean;

  @OneToMany(() => Project, (project) => project.writer)
  projects: Project[];

  @OneToMany(() => Member, (member) => member.user)
  members: Member[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];
}
