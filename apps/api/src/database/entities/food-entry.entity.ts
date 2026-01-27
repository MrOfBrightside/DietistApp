import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MealType, EntryType } from '@dietistapp/shared';
import { ClientProfileEntity } from './client-profile.entity';
import { RecipeEntity } from './recipe.entity';

@Entity('food_entries')
export class FoodEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => ClientProfileEntity, (profile) => profile.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  clientProfile: ClientProfileEntity;

  @Column({ type: 'date' })
  date: string;

  @Column({
    name: 'meal_type',
    type: 'enum',
    enum: MealType,
  })
  mealType: MealType;

  @Column({
    name: 'entry_type',
    type: 'enum',
    enum: EntryType,
  })
  entryType: EntryType;

  @Column({ name: 'food_number', nullable: true })
  foodNumber: string | null;

  @Column({ name: 'food_name_snapshot' })
  foodNameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grams: number;

  @Column({ name: 'recipe_id', type: 'uuid', nullable: true })
  recipeId: string | null;

  @ManyToOne(() => RecipeEntity, { nullable: true })
  @JoinColumn({ name: 'recipe_id' })
  recipe: RecipeEntity;

  @Column({ type: 'time', nullable: true })
  time: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
