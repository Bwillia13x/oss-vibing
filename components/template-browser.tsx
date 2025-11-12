'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

/**
 * Phase 3.2.2: Template Browser
 * UI component for browsing and selecting templates
 */

interface Template {
  id: string
  name: string
  description: string
  category: string
  discipline: string
  file: string
  icon: string
}

interface TemplateIndex {
  templates: {
    docs: Template[]
    sheets: Template[]
    decks: Template[]
  }
  categories: Record<string, string>
  disciplines: Record<string, string>
}

interface TemplateBrowserProps {
  type?: 'docs' | 'sheets' | 'decks'
  onSelect?: (template: Template, type: string) => void
}

export function TemplateBrowser({ type, onSelect }: TemplateBrowserProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<TemplateIndex | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>(type || 'docs')

  useEffect(() => {
    if (open && !templates) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (template: Template) => {
    if (onSelect) {
      onSelect(template, selectedType)
    }
    setOpen(false)
  }

  const getTemplatesForType = () => {
    if (!templates) return []
    return templates.templates[selectedType as keyof typeof templates.templates] || []
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          📚 Browse Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Choose from pre-built templates to get started quickly
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type selector */}
            {!type && (
              <div className="flex gap-2">
                <Button
                  variant={selectedType === 'docs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('docs')}
                >
                  📝 Documents
                </Button>
                <Button
                  variant={selectedType === 'sheets' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('sheets')}
                >
                  📊 Spreadsheets
                </Button>
                <Button
                  variant={selectedType === 'decks' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('decks')}
                >
                  🎯 Presentations
                </Button>
              </div>
            )}

            {/* Template grid */}
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-4">
                {getTemplatesForType().map((template) => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{template.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {templates && (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                {templates.categories[template.category]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {templates.disciplines[template.discipline]}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
