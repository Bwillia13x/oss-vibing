/**
 * Validation Schemas
 * 
 * Zod schemas for validating database operations
 */

import { z } from 'zod'

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['USER', 'ADMIN', 'INSTRUCTOR']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['USER', 'ADMIN', 'INSTRUCTOR']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
})

// Document validation schemas
export const createDocumentSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  title: z.string().min(1).max(500),
  content: z.string(),
  type: z.enum(['NOTE', 'ESSAY', 'THESIS', 'LAB_REPORT', 'PRESENTATION', 'SPREADSHEET', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  folder: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
  type: z.enum(['NOTE', 'ESSAY', 'THESIS', 'LAB_REPORT', 'PRESENTATION', 'SPREADSHEET', 'OTHER']).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  folder: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Reference validation schemas
export const createReferenceSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  doi: z.string().optional(),
  url: z.string().url('Invalid URL').optional(),
  title: z.string().min(1).max(1000),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  year: z.number().int().min(1000).max(9999).optional(),
  journal: z.string().max(500).optional(),
  volume: z.string().max(50).optional(),
  pages: z.string().max(50).optional(),
  publisher: z.string().max(500).optional(),
  type: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const updateReferenceSchema = z.object({
  doi: z.string().optional(),
  url: z.string().url('Invalid URL').optional(),
  title: z.string().min(1).max(1000).optional(),
  authors: z.array(z.string()).min(1, 'At least one author is required').optional(),
  year: z.number().int().min(1000).max(9999).optional(),
  journal: z.string().max(500).optional(),
  volume: z.string().max(50).optional(),
  pages: z.string().max(50).optional(),
  publisher: z.string().max(500).optional(),
  type: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Citation validation schemas
export const createCitationSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  referenceId: z.string().cuid('Invalid reference ID'),
  userId: z.string().cuid('Invalid user ID'),
  location: z.string().max(255).optional(),
  context: z.string().max(2000).optional(),
  type: z.enum(['IN_TEXT', 'FOOTNOTE', 'ENDNOTE', 'BIBLIOGRAPHY']).optional(),
})

export const updateCitationSchema = z.object({
  location: z.string().max(255).optional(),
  context: z.string().max(2000).optional(),
  type: z.enum(['IN_TEXT', 'FOOTNOTE', 'ENDNOTE', 'BIBLIOGRAPHY']).optional(),
})

// Admin Settings validation schemas
export const createAdminSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.unknown(),
  category: z.string().max(100).optional(),
})

// License validation schemas
export const createLicenseSchema = z.object({
  institutionId: z.string().min(1).max(255),
  institution: z.string().min(1).max(500),
  seats: z.number().int().min(1),
  expiresAt: z.date(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
})

export const updateLicenseSchema = z.object({
  institution: z.string().min(1).max(500).optional(),
  seats: z.number().int().min(1).optional(),
  usedSeats: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  expiresAt: z.date().optional(),
})

// Audit Log validation schemas
export const createAuditLogSchema = z.object({
  userId: z.string().cuid('Invalid user ID').optional(),
  action: z.string().min(1).max(255),
  resource: z.string().max(100).optional(),
  resourceId: z.string().cuid('Invalid resource ID').optional(),
  details: z.record(z.unknown()).optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(1000).optional(),
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
})
