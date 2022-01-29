import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from '../comment/comment.entity';
import { Member } from '../member/member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 36 })
  uuid: string;

  @Column({ length: 30, unique: true })
  email: string;

  @Column({ length: 6 })
  name: string;

  @Column()
  studentNo: number;

  @Column({ nullable: true })
  githubId: string;

  @OneToMany(() => Member, (member) => member.userId)
  members: Member[];

  @OneToMany(() => Comment, (comment) => comment.userId)
  comments: Comment[];
}
