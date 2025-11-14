/**
 * Base Repository
 * 
 * Provides common database operations with error handling and retry logic
 */

import { PrismaClient } from '@prisma/client'
import { prisma } from '../client'

export interface PaginationOptions {
  page?: number
  perPage?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export abstract class BaseRepository {
  protected prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  /**
   * Execute operation with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on validation errors or unique constraint violations
        if (
          error instanceof Error &&
          (error.message.includes('Unique constraint') ||
            error.message.includes('Invalid'))
        ) {
          throw new DatabaseError(
            `${operationName} failed: ${error.message}`,
            operationName,
            error
          )
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }

    throw new DatabaseError(
      `${operationName} failed after ${maxRetries} attempts`,
      operationName,
      lastError
    )
  }

  /**
   * Execute operation in transaction
   */
  protected async transaction<T>(
    operation: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return await operation(tx as PrismaClient)
      })
    } catch (error) {
      throw new DatabaseError(
        `Transaction failed: ${(error as Error).message}`,
        'transaction',
        error as Error
      )
    }
  }

  /**
   * Build pagination parameters
   */
  protected buildPagination(options?: PaginationOptions) {
    const page = options?.page ?? 1
    const perPage = options?.perPage ?? 20
    const skip = (page - 1) * perPage

    return {
      skip,
      take: perPage,
      page,
      perPage,
    }
  }

  /**
   * Build pagination result
   */
  protected buildPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    perPage: number
  ): PaginationResult<T> {
    return {
      data,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    }
  }
}
