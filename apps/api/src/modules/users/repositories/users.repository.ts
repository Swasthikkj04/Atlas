import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

interface CreateUserData {
  fullName: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(user: CreateUserData) {
    return this.prisma.user.create({
      data: user,
    });
  }

  async updateProfile(id: string, data: { fullName: string }) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        fullName: data.fullName,
      },
    });
  }
}
