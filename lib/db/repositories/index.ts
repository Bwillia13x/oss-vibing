/**
 * Repository Index
 * 
 * Exports all repositories for easy import
 */

export * from './base-repository'
export * from './user-repository'
export * from './document-repository'
export * from './reference-repository'
export * from './citation-repository'
export * from './admin-settings-repository'
export * from './license-repository'
export * from './audit-log-repository'
export * from './usage-metric-repository'
export * from './assignment-repository'
export * from './submission-repository'
export * from './grade-repository'

// Singleton instances for convenience
import { UserRepository } from './user-repository'
import { DocumentRepository } from './document-repository'
import { ReferenceRepository } from './reference-repository'
import { CitationRepository } from './citation-repository'
import { AdminSettingsRepository } from './admin-settings-repository'
import { LicenseRepository } from './license-repository'
import { AuditLogRepository } from './audit-log-repository'
import { UsageMetricRepository } from './usage-metric-repository'
import { AssignmentRepository } from './assignment-repository'
import { SubmissionRepository } from './submission-repository'
import { GradeRepository } from './grade-repository'

export const userRepository = new UserRepository()
export const documentRepository = new DocumentRepository()
export const referenceRepository = new ReferenceRepository()
export const citationRepository = new CitationRepository()
export const adminSettingsRepository = new AdminSettingsRepository()
export const licenseRepository = new LicenseRepository()
export const auditLogRepository = new AuditLogRepository()
export const usageMetricRepository = new UsageMetricRepository()
export const assignmentRepository = new AssignmentRepository()
export const submissionRepository = new SubmissionRepository()
export const gradeRepository = new GradeRepository()
