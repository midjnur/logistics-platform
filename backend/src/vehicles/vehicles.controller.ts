import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Post()
  async create(@Body() createDto: any, @Request() req: { user: any }) {
    return this.vehiclesService.create({
      ...createDto,
      carrier_id: req.user.userId,
    });
  }

  @Get()
  async findAll(@Request() req: { user: any }) {
    if (req.user.role === 'CARRIER') {
      return this.vehiclesService.findAll(req.user.userId);
    }
    return this.vehiclesService.findAll();
  }
}
