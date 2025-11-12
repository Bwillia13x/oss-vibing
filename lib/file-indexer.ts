/**
 * File indexing utilities for Phase 3.4.1 Database Optimization
 * Provides in-memory indexing for faster file lookups
 * Foundation for future PostgreSQL migration
 */

import * as fs from 'fs/promises'
import * as path from 'path'

export interface FileMetadata {
  path: string
  name: string
  extension: string
  size: number
  created: Date
  modified: Date
  type: 'document' | 'sheet' | 'deck' | 'note' | 'reference' | 'quiz' | 'course' | 'other'
}

export interface FileIndex {
  files: Map<string, FileMetadata>
  byType: Map<string, Set<string>>
  byExtension: Map<string, Set<string>>
  lastUpdated: Date
  errors: Array<{ path: string; error: string }>
}

class FileIndexer {
  private index: FileIndex = {
    files: new Map(),
    byType: new Map(),
    byExtension: new Map(),
    lastUpdated: new Date(),
    errors: [],
  }

  private artifactDirs = [
    'docs',
    'sheets',
    'decks',
    'notes',
    'references',
    'quizzes',
    'courses',
  ]

  /**
   * Get file type from directory
   */
  private getFileType(filePath: string): FileMetadata['type'] {
    const dir = filePath.split(path.sep)[0]
    switch (dir) {
      case 'docs':
        return 'document'
      case 'sheets':
        return 'sheet'
      case 'decks':
        return 'deck'
      case 'notes':
        return 'note'
      case 'references':
        return 'reference'
      case 'quizzes':
        return 'quiz'
      case 'courses':
        return 'course'
      default:
        return 'other'
    }
  }

  /**
   * Build index from file system
   */
  async buildIndex(rootDir: string): Promise<void> {
    this.index = {
      files: new Map(),
      byType: new Map(),
      byExtension: new Map(),
      lastUpdated: new Date(),
      errors: [],
    }

    for (const dir of this.artifactDirs) {
      const dirPath = path.join(rootDir, dir)
      try {
        await this.indexDirectory(dirPath, dir)
      } catch (error) {
        // Directory might not exist, log and continue
        const errorMsg = error instanceof Error ? error.message : String(error)
        this.index.errors.push({ path: dirPath, error: errorMsg })
        continue
      }
    }
  }

  /**
   * Index a directory recursively
   */
  private async indexDirectory(
    dirPath: string,
    relativePath: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relPath = path.join(relativePath, entry.name)

        if (entry.isDirectory()) {
          await this.indexDirectory(fullPath, relPath)
        } else if (entry.isFile()) {
          await this.indexFile(fullPath, relPath)
        }
      }
    } catch (error) {
      // Log unreadable directories for debugging
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.index.errors.push({ path: dirPath, error: errorMsg })
    }
  }

  /**
   * Index a single file
   */
  private async indexFile(fullPath: string, relativePath: string): Promise<void> {
    try {
      const stats = await fs.stat(fullPath)
      const ext = path.extname(relativePath)
      const type = this.getFileType(relativePath)

      const metadata: FileMetadata = {
        path: relativePath,
        name: path.basename(relativePath),
        extension: ext,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type,
      }

      // Add to main index
      this.index.files.set(relativePath, metadata)

      // Add to type index
      if (!this.index.byType.has(type)) {
        this.index.byType.set(type, new Set())
      }
      this.index.byType.get(type)!.add(relativePath)

      // Add to extension index
      if (!this.index.byExtension.has(ext)) {
        this.index.byExtension.set(ext, new Set())
      }
      this.index.byExtension.get(ext)!.add(relativePath)
    } catch (error) {
      // Log unreadable files for debugging
      const errorMsg = error instanceof Error ? error.message : String(error)
      this.index.errors.push({ path: fullPath, error: errorMsg })
    }
  }

  /**
   * Get file metadata
   */
  getFile(filePath: string): FileMetadata | undefined {
    return this.index.files.get(filePath)
  }

  /**
   * Get all files of a specific type
   */
  getFilesByType(type: FileMetadata['type']): FileMetadata[] {
    const paths = this.index.byType.get(type) || new Set()
    return Array.from(paths)
      .map((p) => this.index.files.get(p))
      .filter((m): m is FileMetadata => m !== undefined)
  }

  /**
   * Get all files with a specific extension
   */
  getFilesByExtension(ext: string): FileMetadata[] {
    const paths = this.index.byExtension.get(ext) || new Set()
    return Array.from(paths)
      .map((p) => this.index.files.get(p))
      .filter((m): m is FileMetadata => m !== undefined)
  }

  /**
   * Search files by name (simple substring match)
   */
  searchFiles(query: string): FileMetadata[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.index.files.values()).filter((meta) =>
      meta.name.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get index statistics
   */
  getStats() {
    const stats = {
      totalFiles: this.index.files.size,
      byType: {} as Record<string, number>,
      byExtension: {} as Record<string, number>,
      totalSize: 0,
      lastUpdated: this.index.lastUpdated,
      errors: this.index.errors.length,
    }

    // Count by type
    for (const [type, paths] of this.index.byType.entries()) {
      stats.byType[type] = paths.size
    }

    // Count by extension
    for (const [ext, paths] of this.index.byExtension.entries()) {
      stats.byExtension[ext] = paths.size
    }

    // Calculate total size
    for (const meta of this.index.files.values()) {
      stats.totalSize += meta.size
    }

    return stats
  }

  /**
   * Get indexing errors for debugging
   */
  getErrors() {
    return this.index.errors
  }

  /**
   * Clear index
   */
  clear(): void {
    this.index = {
      files: new Map(),
      byType: new Map(),
      byExtension: new Map(),
      lastUpdated: new Date(),
      errors: [],
    }
  }
}

// Global file indexer
export const fileIndexer = new FileIndexer()

/**
 * Initialize file index (call on server startup)
 */
export async function initializeFileIndex(rootDir: string = process.cwd()): Promise<void> {
  await fileIndexer.buildIndex(rootDir)
}

/**
 * Get cached file metadata (faster than fs operations)
 */
export function getFileMetadata(filePath: string): FileMetadata | undefined {
  return fileIndexer.getFile(filePath)
}

/**
 * Quick file search without hitting file system
 */
export function searchArtifacts(query: string, type?: FileMetadata['type']): FileMetadata[] {
  let results = fileIndexer.searchFiles(query)
  
  if (type) {
    results = results.filter((meta) => meta.type === type)
  }
  
  return results.sort((a, b) => b.modified.getTime() - a.modified.getTime())
}
