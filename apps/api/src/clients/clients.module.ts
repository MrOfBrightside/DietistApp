import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController, DietitianController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientProfileEntity } from '../database/entities/client-profile.entity';
import { UserEntity } from '../database/entities/user.entity';
import { FoodEntryEntity } from '../database/entities/food-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientProfileEntity, UserEntity, FoodEntryEntity]),
  ],
  controllers: [ClientsController, DietitianController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
