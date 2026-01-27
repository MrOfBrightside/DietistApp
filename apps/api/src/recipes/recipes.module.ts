import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeEntity, RecipeItemEntity } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([RecipeEntity, RecipeItemEntity])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
