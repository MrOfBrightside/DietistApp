import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProfileEntity } from '../database/entities/client-profile.entity';
import { UserEntity } from '../database/entities/user.entity';
import { FoodEntryEntity } from '../database/entities/food-entry.entity';
import { UserRole } from '@dietistapp/shared';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientProfileEntity)
    private clientProfileRepository: Repository<ClientProfileEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(FoodEntryEntity)
    private foodEntryRepository: Repository<FoodEntryEntity>,
  ) {}

  async getClientsForDietitian(dietitianUserId: string) {
    const profiles = await this.clientProfileRepository.find({
      where: { dietitianUserId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      email: profile.user.email,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
  }

  async getDietitianStatistics(dietitianUserId: string) {
    // Get total number of clients
    const totalClients = await this.clientProfileRepository.count({
      where: { dietitianUserId },
    });

    // Get clients who have entries today
    const today = new Date().toISOString().split('T')[0];
    const activeToday = await this.foodEntryRepository
      .createQueryBuilder('entry')
      .innerJoin('entry.clientProfile', 'profile')
      .where('profile.dietitian_user_id = :dietitianUserId', { dietitianUserId })
      .andWhere('entry.date = :today', { today })
      .select('COUNT(DISTINCT profile.id)', 'count')
      .getRawOne();

    // Get total entries this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoDate = weekAgo.toISOString().split('T')[0];

    const entriesThisWeek = await this.foodEntryRepository
      .createQueryBuilder('entry')
      .innerJoin('entry.clientProfile', 'profile')
      .where('profile.dietitian_user_id = :dietitianUserId', { dietitianUserId })
      .andWhere('entry.date >= :weekAgoDate', { weekAgoDate })
      .getCount();

    return {
      totalClients,
      activeToday: parseInt(activeToday?.count || '0', 10),
      entriesThisWeek,
    };
  }
}
