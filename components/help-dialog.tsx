/**
 * Help Dialog Component
 * Provides help documentation and keyboard shortcuts
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  Keyboard,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [activeTab, setActiveTab] = useState('getting-started')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Help & Documentation</DialogTitle>
          <DialogDescription>
            Learn how to use Vibe University and find answers to common questions
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">
              <BookOpen className="h-4 w-4 mr-2" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="shortcuts">
              <Keyboard className="h-4 w-4 mr-2" />
              Shortcuts
            </TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="getting-started" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Welcome to Vibe University!</h3>
                <p>
                  Vibe University is an AI-powered academic workspace that helps you study,
                  write, research, and collaborate more effectively.
                </p>

                <h4>Quick Start Guide</h4>
                <ol>
                  <li>
                    <strong>Create a Document:</strong> Click the &ldquo;New Doc&rdquo; button in the
                    navigation bar to start writing.
                  </li>
                  <li>
                    <strong>Use AI Tools:</strong> Select text and use the AI menu to
                    paraphrase, summarize, or expand your content.
                  </li>
                  <li>
                    <strong>Manage Citations:</strong> Add references and citations to your
                    documents with automatic formatting.
                  </li>
                  <li>
                    <strong>Create Flashcards:</strong> Study with AI-generated flashcards
                    based on your notes.
                  </li>
                </ol>

                <h4>Key Features</h4>
                <ul>
                  <li>📝 AI-powered writing assistance</li>
                  <li>📚 Citation management (APA, MLA, Chicago)</li>
                  <li>🎴 Flashcard creation and spaced repetition</li>
                  <li>📊 Data analysis and visualization</li>
                  <li>📄 PDF processing and annotation</li>
                  <li>🔍 Research integration (Google Scholar, CrossRef)</li>
                  <li>📈 Analytics and progress tracking</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Feature Guide</h3>

                <h4>Documents</h4>
                <p>
                  Create and edit academic documents with rich formatting, citations, and
                  AI assistance. Export to PDF, DOCX, or Markdown.
                </p>

                <h4>Presentations</h4>
                <p>
                  Build presentation decks with slides, images, and speaker notes. Export
                  to PowerPoint format.
                </p>

                <h4>Spreadsheets</h4>
                <p>
                  Analyze data with built-in statistical functions. Create charts and
                  visualizations. Export to Excel format.
                </p>

                <h4>Flashcards</h4>
                <p>
                  Create flashcard decks manually or generate them from your notes using
                  AI. Practice with spaced repetition algorithm (SM-2).
                </p>

                <h4>Research Tools</h4>
                <p>
                  Search academic databases, verify citations, and import references
                  directly into your documents.
                </p>

                <h4>AI Assistant</h4>
                <p>
                  Get help with writing, summarizing, paraphrasing, and more. The AI
                  assistant understands academic writing conventions.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">General Shortcuts</h4>
                  <div className="space-y-2">
                    <ShortcutRow keys={['Ctrl', 'N']} action="New Document" />
                    <ShortcutRow keys={['Ctrl', 'S']} action="Save" />
                    <ShortcutRow keys={['Ctrl', 'P']} action="Print/Export" />
                    <ShortcutRow keys={['Ctrl', 'Z']} action="Undo" />
                    <ShortcutRow keys={['Ctrl', 'Y']} action="Redo" />
                    <ShortcutRow keys={['Ctrl', '/']} action="Toggle Help" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Editor Shortcuts</h4>
                  <div className="space-y-2">
                    <ShortcutRow keys={['Ctrl', 'B']} action="Bold" />
                    <ShortcutRow keys={['Ctrl', 'I']} action="Italic" />
                    <ShortcutRow keys={['Ctrl', 'U']} action="Underline" />
                    <ShortcutRow keys={['Ctrl', 'K']} action="Insert Link" />
                    <ShortcutRow keys={['Ctrl', 'Shift', 'C']} action="Insert Citation" />
                    <ShortcutRow keys={['Ctrl', 'Shift', 'F']} action="Find & Replace" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">AI Shortcuts</h4>
                  <div className="space-y-2">
                    <ShortcutRow keys={['Ctrl', 'Space']} action="Open AI Menu" />
                    <ShortcutRow keys={['Ctrl', 'Shift', 'P']} action="Paraphrase Selection" />
                    <ShortcutRow keys={['Ctrl', 'Shift', 'S']} action="Summarize Selection" />
                    <ShortcutRow keys={['Ctrl', 'Shift', 'E']} action="Expand Selection" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Navigation Shortcuts</h4>
                  <div className="space-y-2">
                    <ShortcutRow keys={['Ctrl', '1']} action="Go to Documents" />
                    <ShortcutRow keys={['Ctrl', '2']} action="Go to Decks" />
                    <ShortcutRow keys={['Ctrl', '3']} action="Go to Sheets" />
                    <ShortcutRow keys={['Ctrl', '4']} action="Go to Flashcards" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Get Help</h3>
                  <p className="text-muted-foreground mb-4">
                    Need assistance? We&apos;re here to help!
                  </p>
                  
                  <div className="space-y-3">
                    <SupportOption
                      icon={<Mail className="h-5 w-5" />}
                      title="Email Support"
                      description="Send us an email at support@vibeuniversity.edu"
                      action="Send Email"
                      href="mailto:support@vibeuniversity.edu"
                    />
                    
                    <SupportOption
                      icon={<MessageCircle className="h-5 w-5" />}
                      title="Community Forum"
                      description="Ask questions and share tips with other users"
                      action="Visit Forum"
                      href="https://community.vibeuniversity.edu"
                    />
                    
                    <SupportOption
                      icon={<BookOpen className="h-5 w-5" />}
                      title="Documentation"
                      description="Browse our comprehensive documentation"
                      action="View Docs"
                      href="https://docs.vibeuniversity.edu"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-3">Frequently Asked Questions</h4>
                  <div className="space-y-4">
                    <FAQItem
                      question="How do I export my documents?"
                      answer="Click the export button in the document toolbar and select your preferred format (PDF, DOCX, or Markdown)."
                    />
                    <FAQItem
                      question="Can I use Vibe University offline?"
                      answer="Yes! Documents are cached locally and will sync when you&apos;re back online."
                    />
                    <FAQItem
                      question="How do citations work?"
                      answer="Use Ctrl+Shift+C to insert a citation. You can search our database or manually add references in APA, MLA, or Chicago format."
                    />
                    <FAQItem
                      question="Is my data secure?"
                      answer="Yes. All data is encrypted in transit and at rest. We comply with FERPA regulations for educational institutions."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutRow({ keys, action }: { keys: string[]; action: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{action}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}

function SupportOption({
  icon,
  title,
  description,
  action,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  href: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <div className="mt-1 text-muted-foreground">{icon}</div>
      <div className="flex-1 space-y-1">
        <h5 className="font-medium">{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {action}
          <ExternalLink className="ml-2 h-3 w-3" />
        </a>
      </Button>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-2">
      <h5 className="font-medium">{question}</h5>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  )
}
