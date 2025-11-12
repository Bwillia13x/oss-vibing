import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

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
      const index = JSON.parse(readFileSync(indexPath, 'utf-8'))

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
    const index = JSON.parse(readFileSync(indexPath, 'utf-8'))

    const template = index.templates[type].find((t: any) => t.id === id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const templatePath = join(templatesPath, type, template.file)
    const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'))

    return NextResponse.json(templateData)
  } catch (error) {
    console.error('Template API error:', error)
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    )
  }
}
