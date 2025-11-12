#!/usr/bin/env node

/**
 * Phase 2: LMS Integration Tests
 * 
 * Tests for Canvas LMS integration feature (2.4.1)
 * 
 * Test Coverage:
 * 1. Canvas client library structure
 * 2. LMS sync tool structure
 * 3. Data schema integration
 * 4. Tool registration
 * 5. Mock API interactions (structural)
 * 6. Assignment import workflow
 * 7. Task file generation
 * 8. Configuration handling
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

let passedTests = 0
let failedTests = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
    passedTests++
  } catch (error) {
    console.log(`✗ Failed: ${error.message}`)
    failedTests++
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertExists(filePath, message) {
  if (!existsSync(filePath)) {
    throw new Error(message || `File does not exist: ${filePath}`)
  }
}

function assertContains(content, substring, message) {
  if (!content.includes(substring)) {
    throw new Error(message || `Content does not contain: ${substring}`)
  }
}

console.log('🧪 Phase 2: LMS Integration Tests\n')

// Test 1: Canvas client library exists
console.log('Test 1: Canvas client library exists')
const canvasClientPath = join(rootDir, 'lib', 'lms-canvas-client.ts')
test('Canvas client library file exists', () => {
  assertExists(canvasClientPath)
})

const canvasClientContent = readFileSync(canvasClientPath, 'utf-8')
test('Contains CanvasClient class', () => {
  assertContains(canvasClientContent, 'export class CanvasClient')
})

test('Contains getCourses method', () => {
  assertContains(canvasClientContent, 'async getCourses()')
})

test('Contains getAssignments method', () => {
  assertContains(canvasClientContent, 'async getAssignments(')
})

test('Contains submitAssignment method', () => {
  assertContains(canvasClientContent, 'async submitAssignment(')
})

test('Contains importAssignment method', () => {
  assertContains(canvasClientContent, 'async importAssignment(')
})

test('Contains getUpcomingAssignments method', () => {
  assertContains(canvasClientContent, 'async getUpcomingAssignments(')
})

// Test 2: LMS sync tool exists
console.log('\nTest 2: LMS sync tool exists')
const lmsSyncPath = join(rootDir, 'ai', 'tools', 'lms-sync.ts')
test('LMS sync tool file exists', () => {
  assertExists(lmsSyncPath)
})

const lmsSyncContent = readFileSync(lmsSyncPath, 'utf-8')
test('Contains lmsSync export', () => {
  assertContains(lmsSyncContent, 'export const lmsSync')
})

test('Has action parameter with enum', () => {
  assertContains(lmsSyncContent, "z.enum(['list-courses', 'list-assignments', 'import-assignment', 'submit', 'get-grades'])")
})

test('Supports list-courses action', () => {
  assertContains(lmsSyncContent, "case 'list-courses':")
})

test('Supports list-assignments action', () => {
  assertContains(lmsSyncContent, "case 'list-assignments':")
})

test('Supports import-assignment action', () => {
  assertContains(lmsSyncContent, "case 'import-assignment':")
})

test('Supports submit action', () => {
  assertContains(lmsSyncContent, "case 'submit':")
})

test('Supports get-grades action', () => {
  assertContains(lmsSyncContent, "case 'get-grades':")
})

// Test 3: Data schema integration
console.log('\nTest 3: Data schema integration')
const dataPartsPath = join(rootDir, 'ai', 'messages', 'data-parts.ts')
const dataPartsContent = readFileSync(dataPartsPath, 'utf-8')

test('Data parts includes uni-lms schema', () => {
  assertContains(dataPartsContent, "'uni-lms':")
})

test('LMS schema has action field', () => {
  assertContains(dataPartsContent, "action: z.enum(['list-courses'")
})

test('LMS schema has platform field', () => {
  assertContains(dataPartsContent, "platform: z.enum(['canvas'")
})

test('LMS schema has status field', () => {
  assertContains(dataPartsContent, "status: z.enum(['connecting', 'done', 'error'])")
})

test('LMS schema has courseId field', () => {
  assertContains(dataPartsContent, 'courseId: z.string().optional()')
})

test('LMS schema has assignmentId field', () => {
  assertContains(dataPartsContent, 'assignmentId: z.string().optional()')
})

// Test 4: Tool registration
console.log('\nTest 4: Tool registration')
const toolsIndexPath = join(rootDir, 'ai', 'tools', 'index.ts')
const toolsIndexContent = readFileSync(toolsIndexPath, 'utf-8')

test('Tool is imported', () => {
  assertContains(toolsIndexContent, "import { lmsSync } from './lms-sync'")
})

test('Tool is registered', () => {
  assertContains(toolsIndexContent, 'lmsSync: lmsSync({ writer })')
})

// Test 5: TypeScript interfaces
console.log('\nTest 5: TypeScript interfaces')
test('CanvasConfig interface defined', () => {
  assertContains(canvasClientContent, 'export interface CanvasConfig')
})

test('Assignment interface defined', () => {
  assertContains(canvasClientContent, 'export interface Assignment')
})

test('Submission interface defined', () => {
  assertContains(canvasClientContent, 'export interface Submission')
})

test('Course interface defined', () => {
  assertContains(canvasClientContent, 'export interface Course')
})

// Test 6: Configuration handling
console.log('\nTest 6: Configuration handling')
test('getCanvasConfig function exists', () => {
  assertContains(canvasClientContent, 'export function getCanvasConfig()')
})

test('Reads CANVAS_BASE_URL environment variable', () => {
  assertContains(canvasClientContent, 'process.env.CANVAS_BASE_URL')
})

test('Reads CANVAS_ACCESS_TOKEN environment variable', () => {
  assertContains(canvasClientContent, 'process.env.CANVAS_ACCESS_TOKEN')
})

test('Reads CANVAS_COURSE_ID environment variable', () => {
  assertContains(canvasClientContent, 'process.env.CANVAS_COURSE_ID')
})

// Test 7: Assignment import workflow
console.log('\nTest 7: Assignment import workflow')
test('generateTaskContent method exists', () => {
  assertContains(canvasClientContent, 'private generateTaskContent(')
})

test('Task content includes assignment name', () => {
  assertContains(canvasClientContent, '# ${assignment.name}')
})

test('Task content includes due date', () => {
  assertContains(canvasClientContent, '**Due:**')
})

test('Task content includes points', () => {
  assertContains(canvasClientContent, '**Points:**')
})

test('Task content includes work area', () => {
  assertContains(canvasClientContent, '## Work Area')
})

test('Task path uses tasks directory', () => {
  assertContains(canvasClientContent, "taskPath = `tasks/")
})

// Test 8: Error handling
console.log('\nTest 8: Error handling')
test('Handles missing Canvas config', () => {
  assertContains(lmsSyncContent, 'Canvas LMS is not configured')
})

test('Handles unsupported platforms', () => {
  assertContains(lmsSyncContent, 'is not yet supported')
})

test('Handles missing courseId', () => {
  assertContains(lmsSyncContent, 'courseId is required')
})

test('Handles missing assignmentId', () => {
  assertContains(lmsSyncContent, 'assignmentId is required')
})

test('Handles missing task file', () => {
  assertContains(lmsSyncContent, 'Task file not found')
})

// Test 9: Documentation
console.log('\nTest 9: Documentation')
const lmsDocsPath = join(rootDir, 'docs', 'lms-integration.md')
test('LMS integration documentation exists', () => {
  assertExists(lmsDocsPath)
})

const lmsDocsContent = readFileSync(lmsDocsPath, 'utf-8')
test('Documentation includes setup instructions', () => {
  assertContains(lmsDocsContent, '## Setup')
})

test('Documentation includes usage examples', () => {
  assertContains(lmsDocsContent, '## Usage')
})

test('Documentation includes API reference', () => {
  assertContains(lmsDocsContent, '## API Reference')
})

test('Documentation includes troubleshooting', () => {
  assertContains(lmsDocsContent, '## Troubleshooting')
})

test('Documentation includes security section', () => {
  assertContains(lmsDocsContent, '## Security & Privacy')
})

// Test 10: Canvas API integration patterns
console.log('\nTest 10: Canvas API integration patterns')
test('Uses Authorization header with Bearer token', () => {
  assertContains(canvasClientContent, "'Authorization': `Bearer ${this.accessToken}`")
})

test('Uses Canvas API v1 endpoints', () => {
  assertContains(canvasClientContent, '/api/v1')
})

test('Implements proper error handling for API calls', () => {
  assertContains(canvasClientContent, 'if (!response.ok)')
})

test('Returns JSON responses', () => {
  assertContains(canvasClientContent, 'return response.json()')
})

// Print summary
console.log('\n' + '='.repeat(50))
console.log(`Test Summary: ${passedTests} passed, ${failedTests} failed`)
console.log('='.repeat(50))

if (failedTests > 0) {
  console.log(`✗ ${failedTests} test(s) failed`)
  process.exit(1)
} else {
  console.log('✓ All tests passed!')
  process.exit(0)
}
