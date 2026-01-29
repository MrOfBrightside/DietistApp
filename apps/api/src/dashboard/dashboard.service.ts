import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { ClientProfileEntity } from '../database/entities/client-profile.entity';
import { FoodEntryEntity } from '../database/entities/food-entry.entity';
import { UserRole, DashboardStatsDto, ClientListItemDto } from '@dietistapp/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ClientProfileEntity)
    private clientProfileRepository: Repository<ClientProfileEntity>,
    @InjectRepository(FoodEntryEntity)
    private foodEntryRepository: Repository<FoodEntryEntity>,
  ) {}

  async getDashboardStats(dietitianUserId: string): Promise<DashboardStatsDto> {
    // Get total clients for this dietitian
    const totalClients = await this.clientProfileRepository.count({
      where: { dietitianUserId },
    });

    // Get clients active today (have entries today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeClientIds = await this.foodEntryRepository
      .createQueryBuilder('entry')
      .select('DISTINCT entry.client_id', 'clientId')
      .innerJoin('entry.clientProfile', 'profile')
      .where('profile.dietitian_user_id = :dietitianUserId', { dietitianUserId })
      .andWhere('entry.created_at >= :today', { today })
      .andWhere('entry.created_at < :tomorrow', { tomorrow })
      .getRawMany();

    const activeToday = activeClientIds.length;

    // Get registrations this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const registrationsThisWeek = await this.clientProfileRepository.count({
      where: {
        dietitianUserId,
        createdAt: MoreThan(weekAgo),
      },
    });

    return {
      totalClients,
      activeToday,
      registrationsThisWeek,
    };
  }

  async getClients(dietitianUserId: string): Promise<ClientListItemDto[]> {
    const clientProfiles = await this.clientProfileRepository.find({
      where: { dietitianUserId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const clientsWithActivity = await Promise.all(
      clientProfiles.map(async (profile) => {
        // Get last activity date (most recent food entry)
        const lastEntry = await this.foodEntryRepository.findOne({
          where: { clientId: profile.id },
          order: { updatedAt: 'DESC' },
        });

        return {
          id: profile.user.id,
          email: profile.user.email,
          createdAt: profile.createdAt,
          lastActive: lastEntry ? lastEntry.updatedAt : null,
        };
      }),
    );

    return clientsWithActivity;
  }
}
