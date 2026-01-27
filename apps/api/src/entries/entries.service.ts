import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  CreateFoodEntryDto,
  UpdateFoodEntryDto,
  UserRole,
} from '@dietistapp/shared';
import {
  FoodEntryEntity,
  ClientProfileEntity,
} from '../database/entities';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(FoodEntryEntity)
    private entryRepository: Repository<FoodEntryEntity>,
    @InjectRepository(ClientProfileEntity)
    private clientProfileRepository: Repository<ClientProfileEntity>,
  ) {}

  /**
   * Kontrollera att användaren har tillgång till klient
   */
  private async checkClientAccess(
    userId: string,
    userRole: UserRole,
    clientId: string,
  ) {
    const clientProfile = await this.clientProfileRepository.findOne({
      where: { id: clientId },
      relations: ['user'],
    });

    if (!clientProfile) {
      throw new NotFoundException('Klienten finns inte');
    }

    // Klient kan bara se sina egna data
    if (userRole === UserRole.CLIENT && clientProfile.userId !== userId) {
      throw new ForbiddenException('Du har inte tillgång till denna klient');
    }

    // Dietist kan bara se sina egna klienters data
    if (
      userRole === UserRole.DIETITIAN &&
      clientProfile.dietitianUserId !== userId
    ) {
      throw new ForbiddenException('Du har inte tillgång till denna klient');
    }

    return clientProfile;
  }

  async createEntry(
    userId: string,
    userRole: UserRole,
    clientId: string,
    dto: CreateFoodEntryDto,
  ) {
    await this.checkClientAccess(userId, userRole, clientId);

    const entry = this.entryRepository.create({
      clientId,
      ...dto,
    });

    return this.entryRepository.save(entry);
  }

  async getEntries(
    userId: string,
    userRole: UserRole,
    clientId: string,
    from: string,
    to: string,
  ) {
    await this.checkClientAccess(userId, userRole, clientId);

    return this.entryRepository.find({
      where: {
        clientId,
        date: Between(from, to),
      },
      order: {
        date: 'ASC',
        time: 'ASC',
      },
    });
  }

  async updateEntry(
    userId: string,
    userRole: UserRole,
    entryId: string,
    dto: UpdateFoodEntryDto,
  ) {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId },
      relations: ['clientProfile'],
    });

    if (!entry) {
      throw new NotFoundException('Entry finns inte');
    }

    await this.checkClientAccess(userId, userRole, entry.clientId);

    Object.assign(entry, dto);
    return this.entryRepository.save(entry);
  }

  async deleteEntry(userId: string, userRole: UserRole, entryId: string) {
    const entry = await this.entryRepository.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Entry finns inte');
    }

    await this.checkClientAccess(userId, userRole, entry.clientId);

    await this.entryRepository.remove(entry);
    return { success: true };
  }
}
