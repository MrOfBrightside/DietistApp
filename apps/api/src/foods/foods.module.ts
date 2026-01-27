import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodsController } from './foods.controller';
import { LivsmedelverketService } from './livsmedelsverket.service';
import {
  FoodCacheEntity,
  NutrientCacheEntity,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([FoodCacheEntity, NutrientCacheEntity]),
  ],
  controllers: [FoodsController],
  providers: [LivsmedelverketService],
  exports: [LivsmedelverketService],
})
export class FoodsModule {}
