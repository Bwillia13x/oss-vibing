'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, ChevronRight, GraduationCap, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Vibe University',
        description: 'Let\'s personalize your workspace.',
    },
    {
        id: 'copilot',
        title: 'Meet Your Student Copilot',
        description: 'Your AI research assistant is ready to help.',
    },
    {
        id: 'action',
        title: 'Try It Out',
        description: 'Ask the copilot to find sources for a topic.',
    },
    {
        id: 'success',
        title: 'You\'re All Set!',
        description: 'Start your academic journey.',
    }
]

export function OnboardingWizard() {
    const {
        isOpen,
        currentStep,
        setCurrentStep,
        completeOnboarding,
        hasSeenOnboarding,
        setIsOpen,
        userRole,
        setUserRole
    } = useOnboardingStore()

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // Trigger onboarding if not seen
        if (!hasSeenOnboarding) {
            setIsOpen(true)
        }
    }, [hasSeenOnboarding, setIsOpen])

    if (!isMounted || !isOpen) return null

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            completeOnboarding()
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Welcome
                return (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">What is your primary focus?</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Undergrad', 'Graduate', 'Researcher', 'Educator'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setUserRole(role)}
                                    className={cn(
                                        "p-4 rounded-lg border text-left transition-all hover:border-primary",
                                        userRole === role ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                                    )}
                                >
                                    <span className="font-medium">{role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            case 1: // Copilot
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center p-8 bg-secondary/50 rounded-xl">
                            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                        </div>
                        <p className="text-muted-foreground">
                            The chat bar below is your gateway to research, writing, and analysis.
                            It's context-aware and connected to academic databases.
                        </p>
                    </div>
                )
            case 2: // Action
                return (
                    <div className="space-y-4">
                        <div className="p-4 border border-dashed rounded-lg bg-muted/50">
                            <p className="text-sm font-medium mb-2">Try asking:</p>
                            <code className="text-xs bg-background p-2 rounded block">
                                "Find recent papers on climate change impacts"
                            </code>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Go ahead, type it in the chat bar! (Or click Next to skip)
                        </p>
                    </div>
                )
            case 3: // Success
                return (
                    <div className="space-y-4 text-center py-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-muted-foreground">
                            Your workspace is ready. Use the sidebar to manage documents and the chat for assistance.
                        </p>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg"
            >
                <Card className="p-6 shadow-2xl border-primary/20">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-md">
                                <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">{STEPS[currentStep].title}</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Step {currentStep + 1} of {STEPS.length}
                        </span>
                    </div>

                    <div className="mb-8 min-h-[180px]">
                        <p className="text-base text-muted-foreground mb-6">
                            {STEPS[currentStep].description}
                        </p>
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="ghost" onClick={completeOnboarding} className="text-muted-foreground">
                            Skip
                        </Button>
                        <Button onClick={handleNext} disabled={currentStep === 0 && !userRole}>
                            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
