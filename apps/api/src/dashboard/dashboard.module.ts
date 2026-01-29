import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UserEntity } from '../database/entities/user.entity';
import { ClientProfileEntity } from '../database/entities/client-profile.entity';
import { FoodEntryEntity } from '../database/entities/food-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ClientProfileEntity, FoodEntryEntity]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
