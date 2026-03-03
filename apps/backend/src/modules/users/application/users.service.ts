import { Injectable, NotFoundException } from '@nestjs/common';
import { UserCredentials, UsersPublicApi } from './users-public-api';
import { UserReadService, UserRepositoryPort } from '../domain/ports/user.repository.port';
import { MeResponseDto } from '@repo/schemas';
import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/entities/role.entity';
import { RoleRepositoryPort } from '../domain/ports/role.repository.port';

@Injectable()
export class UsersService implements UsersPublicApi {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly readService: UserReadService,
  ) {}

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.readService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // PUBLIC API
  async create(dto: User): Promise<string> {
    return await this.userRepository.save(dto);
  }

  async createRole(dto: Role): Promise<string> {
    return await this.roleRepository.save(dto);
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return await this.readService.findCredentialsByEmail(email);
  }

  async isEmailTaken(email: string): Promise<boolean> {
    return await this.readService.isEmailTaken(email);
  }
}
