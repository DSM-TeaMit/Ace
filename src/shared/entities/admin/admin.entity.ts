import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from '../comment/comment.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 36 })
  uuid: string;

  @Column({ length: 16 })
  uid: string;

  @Column({ length: 6 })
  name: string;

  @Column({ length: 60 })
  password: string;

  @Column({ length: 200, nullable: true })
  thumbnailUrl: string;

  @Column({ length: 1, nullable: true })
  emoji: string;

  @ManyToOne(() => Admin, (admin) => admin.childAccounts)
  parentAccount: Admin;

  @OneToMany(() => Admin, (admin) => admin.parentAccount)
  childAccounts: Admin[];

  @OneToMany(() => Comment, (comment) => comment.adminId)
  comments: Comment[];
}
