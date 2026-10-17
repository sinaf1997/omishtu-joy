import { usersRepository, UsersRepository } from './users.repository.js';
import { User, CreateUserData } from './users.types.js';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findByEmail(email.toLowerCase().trim());
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findById(id);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.repo.create({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
  }
}

export const usersService = new UsersService();
