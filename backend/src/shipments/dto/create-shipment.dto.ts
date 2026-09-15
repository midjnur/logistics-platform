import { IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Only declares the fields that are genuinely required (NOT NULL columns)
 * or that have previously reached the database malformed and crashed the
 * insert (pickup_time/delivery_time). Deliberately not exhaustive over
 * every optional field on Shipment (dimensions, requirements, financials,
 * etc.) — those still pass through to the service untouched, same as
 * before. This is validation to catch bad input early with a clean error,
 * not a full re-typing of the entity.
 */
export class CreateShipmentDto {
  @IsString()
  @IsNotEmpty()
  pickup_address: string;

  @IsNumber()
  pickup_lat: number;

  @IsNumber()
  pickup_lng: number;

  @IsOptional()
  @IsISO8601()
  pickup_time?: string;

  @IsString()
  @IsNotEmpty()
  delivery_address: string;

  @IsNumber()
  delivery_lat: number;

  @IsNumber()
  delivery_lng: number;

  @IsOptional()
  @IsISO8601()
  delivery_time?: string;

  @IsString()
  @IsNotEmpty()
  cargo_type: string;

  @IsNumber()
  weight_kg: number;
}
