import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecipeEntity } from './recipe.entity';

@Entity('recipe_items')
export class RecipeItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipe_id', type: 'uuid' })
  recipeId: string;

  @ManyToOne(() => RecipeEntity, (recipe) => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: RecipeEntity;

  @Column({ name: 'food_number' })
  foodNumber: string;

  @Column({ name: 'food_name_snapshot' })
  foodNameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grams: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
