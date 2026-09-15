import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password_hash', 'role', 'is_active'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['carrier', 'shipper'],
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email_verification_token: token } });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.findById(id);
  }

  async create(userData: Partial<User>): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      userData.password_hash || '',
      salt,
    );

    const newUser = this.usersRepository.create({
      ...userData,
      password_hash: hashedPassword,
    });

    return this.usersRepository.save(newUser);
  }
}
