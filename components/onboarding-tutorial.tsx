'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

/**
 * Phase 3.2.1: Onboarding Tutorial/Wizard
 * Interactive guide for new users to learn about Vibe University features
 */

interface OnboardingStep {
  title: string
  description: string
  content: React.ReactNode
  icon: string
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Vibe University! 🎓',
    description: 'Your unified academic workflow platform',
    icon: '🎓',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          Vibe University is a comprehensive platform that replaces Office/365 for academic work while maintaining strict academic integrity.
        </p>
        <div className="grid gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h4 className="font-semibold">Documents</h4>
              <p className="text-sm text-muted-foreground">Write essays, research papers, and lab reports</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-semibold">Spreadsheets</h4>
              <p className="text-sm text-muted-foreground">Analyze data with statistical tools</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h4 className="font-semibold">Presentations</h4>
              <p className="text-sm text-muted-foreground">Create professional academic presentations</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Student Copilot 🤖',
    description: 'Your AI-powered academic assistant',
    icon: '🤖',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          The Student Copilot helps you with all academic tasks while maintaining academic integrity through provenance tracking.
        </p>
        <div className="space-y-2 text-sm">
          <div className="p-3 bg-muted rounded-md">
            <p className="font-semibold mb-1">Example queries:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>"Help me write an essay on climate change"</li>
              <li>"Find sources about renewable energy"</li>
              <li>"Create a presentation on photosynthesis"</li>
              <li>"Analyze this temperature dataset"</li>
            </ul>
          </div>
        </div>
        <Badge className="w-full justify-center">
          Every AI-generated text is watermarked until you accept it
        </Badge>
      </div>
    ),
  },
  {
    title: 'Academic Integrity 🛡️',
    description: 'Built-in citation management and provenance tracking',
    icon: '🛡️',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          Vibe University ensures academic integrity through:
        </p>
        <div className="grid gap-3">
          <div className="p-3 border rounded-md">
            <h4 className="font-semibold flex items-center gap-2">
              <span>📚</span> Citation Management
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Automatic citation in APA, MLA, or Chicago format
            </p>
          </div>
          <div className="p-3 border rounded-md">
            <h4 className="font-semibold flex items-center gap-2">
              <span>🔍</span> Source Verification
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              All facts require credible sources with DOI or URL
            </p>
          </div>
          <div className="p-3 border rounded-md">
            <h4 className="font-semibold flex items-center gap-2">
              <span>📜</span> Provenance Tracking
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Complete history of all changes and AI assistance
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Templates & Tools 🛠️',
    description: 'Pre-built templates and academic tools',
    icon: '🛠️',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          Get started quickly with our template library:
        </p>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-xl">📝</span>
            <span>Academic Essay Template</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-xl">📄</span>
            <span>Research Paper Template</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-xl">🔬</span>
            <span>Lab Report Template</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            <span className="text-xl">📊</span>
            <span>Data Analysis Template</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Click <Badge variant="outline">📚 Browse Templates</Badge> in the interface to explore more
        </p>
      </div>
    ),
  },
  {
    title: 'Keyboard Shortcuts ⌨️',
    description: 'Work efficiently with keyboard shortcuts',
    icon: '⌨️',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          Master these shortcuts for faster workflow:
        </p>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between p-2 border rounded">
            <span>Toggle theme</span>
            <Badge variant="outline">Ctrl+Shift+T</Badge>
          </div>
          <div className="flex justify-between p-2 border rounded">
            <span>Show all shortcuts</span>
            <Badge variant="outline">?</Badge>
          </div>
          <div className="flex justify-between p-2 border rounded">
            <span>Focus chat input</span>
            <Badge variant="outline">/</Badge>
          </div>
          <div className="flex justify-between p-2 border rounded">
            <span>Navigate up/down</span>
            <Badge variant="outline">↑ ↓</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Press <Badge variant="outline">?</Badge> anytime to see all shortcuts
        </p>
      </div>
    ),
  },
  {
    title: 'Ready to Start! 🚀',
    description: 'You\'re all set to use Vibe University',
    icon: '🚀',
    content: (
      <div className="space-y-4">
        <p className="text-base">
          You now know the basics! Here are some tips:
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-accent rounded-md">
            <h4 className="font-semibold">💡 Pro Tip</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Start by asking the Copilot: "Help me create a research paper on [your topic]"
            </p>
          </div>
          <div className="p-3 bg-accent rounded-md">
            <h4 className="font-semibold">📚 Next Steps</h4>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>• Browse templates to find one that fits your needs</li>
              <li>• Ask the Copilot questions about your assignments</li>
              <li>• Check the Provenance tab to see tool execution</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-center py-4">
          <Badge className="text-lg px-6 py-2">
            Happy Learning! 🎓
          </Badge>
        </div>
      </div>
    ),
  },
]

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('vibe-university-onboarding-seen')
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('vibe-university-onboarding-seen', 'true')
    setOpen(false)
    setCurrentStep(0)
  }

  const handleSkip = () => {
    localStorage.setItem('vibe-university-onboarding-seen', 'true')
    setOpen(false)
    setCurrentStep(0)
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const step = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{step.icon}</span>
            <div>
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
              <DialogDescription>{step.description}</DialogDescription>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-4">
          {step.content}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {currentStep === 0 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tutorial
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
