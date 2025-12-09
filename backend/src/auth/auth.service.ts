import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/user.entity';
import { CarriersService } from '../carriers/carriers.service';
import { DocumentsService } from '../documents/documents.service';
import { DocumentType } from '../documents/document.entity';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private carriersService: CarriersService,
    private documentsService: DocumentsService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneWithPassword(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    registerDto: RegisterDto,
    files?: { [key: string]: Express.Multer.File[] },
  ) {
    // Check if user exists
    const existingUser = await this.usersService.findOne(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Create user
    const newUser = await this.usersService.create({
      email: registerDto.email,
      phone: registerDto.phone,
      password_hash: registerDto.password, // This will be hashed in UsersService
      role: registerDto.role,
      language: registerDto.language || 'en',
    });

    // If role is CARRIER, create carrier profile
    if (newUser.role === UserRole.CARRIER) {
      await this.carriersService.create({
        user_id: newUser.id,
        first_name: registerDto.firstName || '',
        last_name: registerDto.lastName || '',
        company_name: registerDto.companyName || '',
        tax_id: registerDto.taxId || '',
        passport_number: registerDto.passportNumber || '',
        bank_name: registerDto.bankName,
        bank_code: registerDto.bankCode,
        bank_account: registerDto.bankAccount,
        currency: registerDto.currency,
        city: registerDto.city,
        country: registerDto.country,
      });

      // Handle file uploads
      if (files) {
        if (files.driverLicense?.[0]) {
          await this.documentsService.uploadFile(
            files.driverLicense[0],
            newUser.id,
            DocumentType.LICENSE,
          );
        }
        if (files.passport?.[0]) {
          await this.documentsService.uploadFile(
            files.passport[0],
            newUser.id,
            DocumentType.PASSPORT,
          );
        }
        if (files.insurance?.[0]) {
          await this.documentsService.uploadFile(
            files.insurance[0],
            newUser.id,
            DocumentType.INSURANCE,
          );
        }
        // Add more as needed
      }
    }

    return this.login(newUser);
  }
}
