import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
    isOpen: boolean
    currentStep: number
    completedSteps: string[]
    hasSeenOnboarding: boolean
    userRole: string | null

    setIsOpen: (isOpen: boolean) => void
    setCurrentStep: (step: number) => void
    completeStep: (stepId: string) => void
    completeOnboarding: () => void
    setUserRole: (role: string) => void
    reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            isOpen: false, // Default to false, will be triggered by logic in page
            currentStep: 0,
            completedSteps: [],
            hasSeenOnboarding: false,
            userRole: null,

            setIsOpen: (isOpen) => set({ isOpen }),
            setCurrentStep: (currentStep) => set({ currentStep }),
            completeStep: (stepId) =>
                set((state) => ({
                    completedSteps: [...state.completedSteps, stepId]
                })),
            completeOnboarding: () =>
                set({
                    isOpen: false,
                    hasSeenOnboarding: true,
                    currentStep: 0
                }),
            setUserRole: (userRole) => set({ userRole }),
            reset: () => set({
                isOpen: true,
                currentStep: 0,
                completedSteps: [],
                hasSeenOnboarding: false,
                userRole: null
            }),
        }),
        {
            name: 'vibe-onboarding-storage',
        }
    )
)
