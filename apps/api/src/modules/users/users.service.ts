import { Injectable } from '@nestjs/common';

import { UsersRepository } from './repositories/users.repository';

interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async create(user: CreateUserData) {
    return this.usersRepository.create(user);
  }
}
