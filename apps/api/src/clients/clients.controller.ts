import { Controller, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@dietistapp/shared';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @Roles(UserRole.DIETITIAN, UserRole.ADMIN)
  async getClients(@CurrentUser() user: any) {
    if (user.role !== UserRole.DIETITIAN && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only dietitians can access client list');
    }

    return this.clientsService.getClientsForDietitian(user.id);
  }
}

@Controller('dietitian')
@UseGuards(JwtAuthGuard)
export class DietitianController {
  constructor(private clientsService: ClientsService) {}

  @Get('statistics')
  @Roles(UserRole.DIETITIAN, UserRole.ADMIN)
  async getStatistics(@CurrentUser() user: any) {
    if (user.role !== UserRole.DIETITIAN && user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only dietitians can access statistics');
    }

    return this.clientsService.getDietitianStatistics(user.id);
  }
}
