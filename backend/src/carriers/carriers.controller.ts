import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CarriersService } from './carriers.service';
import { VerificationStatus } from './carrier.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('carriers')
@UseGuards(AuthGuard('jwt'))
export class CarriersController {
  constructor(private carriersService: CarriersService) {}

  @Post('profile')
  async createProfile(@Body() profileData: any, @Request() req: { user: any }) {
    return this.carriersService.create({
      ...profileData,
      user_id: req.user.userId,
    });
  }

  @Get('profile')
  async getMyProfile(@Request() req: { user: any }) {
    return this.carriersService.findByUserId(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(@Body() updateData: any, @Request() req: { user: any }) {
    const carrier = await this.carriersService.findByUserId(req.user.userId);
    if (!carrier) {
      return { error: 'Carrier profile not found' };
    }
    return this.carriersService.update(carrier.user_id, updateData);
  }
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingCarriers() {
    return this.carriersService.findAllPending();
  }

  @Patch('admin/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async verifyCarrier(
    @Param('id') id: string,
    @Body('status') status: VerificationStatus,
  ) {
    return this.carriersService.updateStatus(id, status);
  }
}
