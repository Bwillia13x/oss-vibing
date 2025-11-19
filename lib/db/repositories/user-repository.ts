/**
 * User Repository
 * 
 * Handles all user-related database operations
 */

import { User, Role, UserStatus, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateUserData {
  email: string
  name?: string
  role?: Role
  status?: UserStatus
  lastLoginAt?: Date
}

export interface UpdateUserData {
  email?: string
  name?: string
  role?: Role
  status?: UserStatus
  lastLoginAt?: Date
}

export interface UserFilters {
  role?: Role
  status?: UserStatus
  search?: string
}

export class UserRepository extends BaseRepository {
  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: data.role ?? 'USER',
            status: data.status ?? 'ACTIVE',
            lastLoginAt: data.lastLoginAt,
          },
        })
      },
      'createUser'
    )
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.findUnique({
          where: { id },
        })
      },
      'findUserById'
    )
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.findUnique({
          where: { email },
        })
      },
      'findUserByEmail'
    )
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.update({
          where: { id },
          data,
        })
      },
      'updateUser'
    )
  }

  /**
   * Delete user (soft delete by setting status to DELETED)
   */
  async delete(id: string): Promise<User> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.update({
          where: { id },
          data: { status: 'DELETED' },
        })
      },
      'deleteUser'
    )
  }

  /**
   * Hard delete user (removes from database)
   */
  async hardDelete(id: string): Promise<User> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.delete({
          where: { id },
        })
      },
      'hardDeleteUser'
    )
  }

  /**
   * List users with pagination and filters
   */
  async list(
    filters?: UserFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<User>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.UserWhereInput = {}

        if (filters?.role) {
          where.role = filters.role
        }

        if (filters?.status) {
          where.status = filters.status
        }

        if (filters?.search) {
          where.OR = [
            { email: { contains: filters.search } },
            { name: { contains: filters.search } },
          ]
        }

        const [data, total] = await Promise.all([
          this.prisma.user.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.user.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listUsers'
    )
  }

  /**
   * Count users by role
   */
  async countByRole(role: Role): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.count({
          where: { role },
        })
      },
      'countUsersByRole'
    )
  }

  /**
   * Count users by status
   */
  async countByStatus(status: UserStatus): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.user.count({
          where: { status },
        })
      },
      'countUsersByStatus'
    )
  }

  /**
   * Bulk create users
   */
  async bulkCreate(users: CreateUserData[]): Promise<number> {
    return this.withRetry(
      async () => {
        const result = await this.prisma.user.createMany({
          data: users.map(user => ({
            email: user.email,
            name: user.name,
            role: user.role ?? 'USER',
            status: user.status ?? 'ACTIVE',
          })),
        })
        return result.count
      },
      'bulkCreateUsers'
    )
  }
}

// Export singleton instance
export const userRepository = new UserRepository()
