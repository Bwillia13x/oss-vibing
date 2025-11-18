/**
 * Admin Analytics Tests
 * 
 * Tests for database-backed admin analytics functionality
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { prisma } from '@/lib/db/client';
import {
  getInstitutionAnalytics,
  getStudentProgress,
  getPlagiarismReports,
  trackUserActivity,
  updateStudentProgress,
} from '@/lib/admin-analytics';

describe('Admin Analytics', () => {
  let userId1: string;
  let userId2: string;
  let documentId1: string;
  let assignmentId: string;
  let submissionId: string;

  beforeEach(async () => {
    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'student1@test.com',
        name: 'Student One',
        role: 'USER',
        lastLoginAt: new Date(),
      },
    });
    userId1 = user1.id;

    const user2 = await prisma.user.create({
      data: {
        email: 'student2@test.com',
        name: 'Student Two',
        role: 'USER',
        lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    });
    userId2 = user2.id;

    // Create test documents
    const document1 = await prisma.document.create({
      data: {
        userId: userId1,
        title: 'Test Document',
        content: 'Content',
        type: 'NOTE',
        status: 'COMPLETED',
      },
    });
    documentId1 = document1.id;

    // Create test reference and citation
    const reference = await prisma.reference.create({
      data: {
        userId: userId1,
        title: 'Test Reference',
        authors: JSON.stringify(['Author 1']),
        type: 'article-journal',
      },
    });

    await prisma.citation.create({
      data: {
        documentId: documentId1,
        referenceId: reference.id,
        userId: userId1,
        type: 'IN_TEXT',
      },
    });

    // Create test assignment and submission
    const assignment = await prisma.assignment.create({
      data: {
        title: 'Test Assignment',
        instructorId: userId1,
        dueDate: new Date(),
        maxPoints: 100,
        courseId: 'course-1',
        published: true,
      },
    });
    assignmentId = assignment.id;

    const submission = await prisma.submission.create({
      data: {
        assignmentId: assignmentId,
        studentId: userId2,
        content: 'Submission content',
        status: 'SUBMITTED',
        plagiarismCheck: JSON.stringify({
          similarityScore: 15,
          sources: [
            { url: 'http://example.com', title: 'Example', matchPercentage: 15 },
          ],
        }),
      },
    });
    submissionId = submission.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.citation.deleteMany({});
    await prisma.reference.deleteMany({});
    await prisma.grade.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.usageMetric.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('getInstitutionAnalytics', () => {
    it('should return analytics for a period', async () => {
      const analytics = await getInstitutionAnalytics('inst-1', 'week');

      expect(analytics).toBeTruthy();
      expect(analytics.institutionId).toBe('inst-1');
      expect(analytics.period).toBe('week');
      expect(analytics.totalUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(analytics.totalCitations).toBeGreaterThanOrEqual(0);
    });

    it('should count active users correctly', async () => {
      const analytics = await getInstitutionAnalytics('inst-1', 'day');

      // User1 logged in today, User2 logged in 7 days ago
      expect(analytics.activeUsers).toBeGreaterThanOrEqual(1);
    });

    it('should count documents and citations', async () => {
      const analytics = await getInstitutionAnalytics('inst-1', 'month');

      expect(analytics.totalDocuments).toBeGreaterThanOrEqual(1);
      expect(analytics.totalCitations).toBeGreaterThanOrEqual(1);
    });

    it('should aggregate tool usage from metrics', async () => {
      // Track some tool usage
      await trackUserActivity(userId1, {
        userId: userId1,
        date: new Date(),
        documentsCreated: 1,
        sheetsCreated: 0,
        decksCreated: 0,
        citationsInserted: 1,
        toolsUsed: { 'find-sources': 3, 'check-grammar': 2 },
        timeSpentMinutes: 30,
        exportCount: 1,
      });

      const analytics = await getInstitutionAnalytics('inst-1', 'day');

      expect(analytics.toolUsage['find-sources']).toBe(3);
      expect(analytics.toolUsage['check-grammar']).toBe(2);
    });

    it('should calculate average session time', async () => {
      // Track session times
      await trackUserActivity(userId1, {
        userId: userId1,
        date: new Date(),
        documentsCreated: 0,
        sheetsCreated: 0,
        decksCreated: 0,
        citationsInserted: 0,
        toolsUsed: {},
        timeSpentMinutes: 20,
        exportCount: 0,
      });

      await trackUserActivity(userId2, {
        userId: userId2,
        date: new Date(),
        documentsCreated: 0,
        sheetsCreated: 0,
        decksCreated: 0,
        citationsInserted: 0,
        toolsUsed: {},
        timeSpentMinutes: 40,
        exportCount: 0,
      });

      const analytics = await getInstitutionAnalytics('inst-1', 'day');

      expect(analytics.averageSessionTime).toBeGreaterThan(0);
    });
  });

  describe('getStudentProgress', () => {
    it('should return progress for all students', async () => {
      const progress = await getStudentProgress('inst-1');

      expect(Array.isArray(progress)).toBe(true);
      expect(progress.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate completed documents', async () => {
      const progress = await getStudentProgress('inst-1');

      const student1Progress = progress.find((p) => p.studentId === userId1);
      expect(student1Progress).toBeTruthy();
      expect(student1Progress!.documentsCompleted).toBeGreaterThanOrEqual(1);
    });

    it('should calculate citations added', async () => {
      const progress = await getStudentProgress('inst-1');

      const student1Progress = progress.find((p) => p.studentId === userId1);
      expect(student1Progress).toBeTruthy();
      expect(student1Progress!.citationsAdded).toBeGreaterThanOrEqual(1);
    });

    it('should calculate integrity score', async () => {
      const progress = await getStudentProgress('inst-1');

      const student1Progress = progress.find((p) => p.studentId === userId1);
      expect(student1Progress).toBeTruthy();
      expect(student1Progress!.integrityScore).toBeGreaterThanOrEqual(0);
      expect(student1Progress!.integrityScore).toBeLessThanOrEqual(100);
    });

    it('should track last activity', async () => {
      const progress = await getStudentProgress('inst-1');

      const student1Progress = progress.find((p) => p.studentId === userId1);
      expect(student1Progress).toBeTruthy();
      expect(student1Progress!.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('getPlagiarismReports', () => {
    it('should return plagiarism reports', async () => {
      const reports = await getPlagiarismReports('inst-1');

      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse similarity score', async () => {
      const reports = await getPlagiarismReports('inst-1');

      const report = reports.find((r) => r.studentId === userId2);
      expect(report).toBeTruthy();
      expect(report!.similarityScore).toBe(15);
    });

    it('should determine status from similarity score', async () => {
      const reports = await getPlagiarismReports('inst-1');

      const report = reports.find((r) => r.studentId === userId2);
      expect(report).toBeTruthy();
      // 15% similarity should be 'warning' (10-25%)
      expect(report!.status).toBe('warning');
    });

    it('should filter by status', async () => {
      const warningReports = await getPlagiarismReports('inst-1', 'warning');

      expect(warningReports.every((r) => r.status === 'warning')).toBe(true);
    });

    it('should include sources', async () => {
      const reports = await getPlagiarismReports('inst-1');

      const report = reports.find((r) => r.studentId === userId2);
      expect(report).toBeTruthy();
      expect(Array.isArray(report!.sources)).toBe(true);
      expect(report!.sources.length).toBeGreaterThan(0);
    });
  });

  describe('trackUserActivity', () => {
    it('should create usage metrics for activity', async () => {
      await trackUserActivity(userId1, {
        userId: userId1,
        date: new Date(),
        documentsCreated: 2,
        sheetsCreated: 1,
        decksCreated: 0,
        citationsInserted: 5,
        toolsUsed: { 'find-sources': 3 },
        timeSpentMinutes: 45,
        exportCount: 1,
      });

      const metrics = await prisma.usageMetric.findMany({
        where: { userId: userId1 },
      });

      expect(metrics.length).toBeGreaterThan(0);
      
      // Check specific metrics exist
      const docMetric = metrics.find((m) => m.metric === 'documents_created');
      expect(docMetric?.value).toBe(2);

      const toolMetric = metrics.find((m) => m.metric === 'tool_find-sources');
      expect(toolMetric?.value).toBe(3);
    });
  });

  describe('updateStudentProgress', () => {
    it('should store progress as metrics', async () => {
      await updateStudentProgress(userId1, {
        studentId: userId1,
        documentsCompleted: 5,
        citationsAdded: 20,
        integrityScore: 85,
        lastActivity: new Date(),
        milestones: [],
      });

      const metrics = await prisma.usageMetric.findMany({
        where: {
          userId: userId1,
          metric: { in: ['documents_completed', 'citations_added', 'integrity_score'] },
        },
      });

      expect(metrics.length).toBeGreaterThan(0);
      
      const integrityMetric = metrics.find((m) => m.metric === 'integrity_score');
      expect(integrityMetric?.value).toBe(85);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
