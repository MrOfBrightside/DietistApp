import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntriesController, SummaryController } from './entries.controller';
import { EntriesService } from './entries.service';
import { NutritionCalculationService } from './nutrition-calculation.service';
import {
  FoodEntryEntity,
  ClientProfileEntity,
  RecipeEntity,
} from '../database/entities';
import { FoodsModule } from '../foods/foods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FoodEntryEntity,
      ClientProfileEntity,
      RecipeEntity,
    ]),
    FoodsModule,
  ],
  controllers: [EntriesController, SummaryController],
  providers: [EntriesService, NutritionCalculationService],
  exports: [EntriesService, NutritionCalculationService],
})
export class EntriesModule {}
