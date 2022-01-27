import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

}
