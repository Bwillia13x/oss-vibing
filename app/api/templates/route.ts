import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, normalize } from 'path'

/**
 * Phase 3.2.2: Template Library API
 * Serves templates for documents, spreadsheets, and presentations
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // docs, sheets, decks
    const id = searchParams.get('id')

    const templatesPath = join(process.cwd(), 'templates')

    // Return template index if no specific template requested
    if (!id) {
      const indexPath = join(templatesPath, 'index.json')
      const indexData = await readFile(indexPath, 'utf-8')
      const index = JSON.parse(indexData)

      // Filter by type if specified
      if (type && ['docs', 'sheets', 'decks'].includes(type)) {
        return NextResponse.json({
          templates: { [type]: index.templates[type] },
          categories: index.categories,
          disciplines: index.disciplines,
        })
      }

      return NextResponse.json(index)
    }

    // Return specific template
    if (!type || !['docs', 'sheets', 'decks'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be docs, sheets, or decks' },
        { status: 400 }
      )
    }

    const indexPath = join(templatesPath, 'index.json')
    const indexData = await readFile(indexPath, 'utf-8')
    const index = JSON.parse(indexData)

    const template = index.templates[type].find((t: any) => t.id === id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validate template.file to prevent path traversal
    if (template.file.includes('..') || template.file.includes('/') || template.file.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid template file path' },
        { status: 400 }
      )
    }

    const templatePath = normalize(join(templatesPath, type, template.file))
    
    // Ensure the resolved path is still within templates directory
    if (!templatePath.startsWith(normalize(templatesPath))) {
      return NextResponse.json(
        { error: 'Invalid template file path' },
        { status: 400 }
      )
    }

    const templateContent = await readFile(templatePath, 'utf-8')
    const templateData = JSON.parse(templateContent)

    return NextResponse.json(templateData)
  } catch (error) {
    console.error('Template API error:', error)
    
    let errorMessage = 'Failed to load template'
    if (error && typeof error === 'object') {
      if ('code' in error && error.code === 'ENOENT') {
        errorMessage = 'Template file not found'
      } else if ('name' in error && error.name === 'SyntaxError') {
        errorMessage = 'Template file contains invalid JSON'
      } else if ('message' in error && typeof error.message === 'string') {
        errorMessage = `${errorMessage}: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
