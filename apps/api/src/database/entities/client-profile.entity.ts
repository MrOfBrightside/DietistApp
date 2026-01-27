import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FoodEntryEntity } from './food-entry.entity';

@Entity('client_profiles')
export class ClientProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'dietitian_user_id', type: 'uuid' })
  dietitianUserId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dietitian_user_id' })
  dietitian: UserEntity;

  @OneToMany(() => FoodEntryEntity, (entry) => entry.clientProfile)
  entries: FoodEntryEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
