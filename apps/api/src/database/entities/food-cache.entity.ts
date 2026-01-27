import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('food_cache')
export class FoodCacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'food_number', unique: true })
  @Index()
  foodNumber: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson: any;

  @Column({ name: 'fetched_at' })
  fetchedAt: Date;

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'api_version', nullable: true })
  apiVersion: string | null;
}
