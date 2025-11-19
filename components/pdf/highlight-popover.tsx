'use client'

import { Button } from '@/components/ui/button'
import { MessageCircle, Highlighter } from 'lucide-react'

interface Props {
    onHighlight: () => void
    onAskCopilot: () => void
}

export function HighlightPopover({ onHighlight, onAskCopilot }: Props) {
    return (
        <div className="bg-background border border-border rounded-md shadow-lg p-1 flex gap-1 animate-in fade-in zoom-in duration-200">
            <Button
                variant="ghost"
                size="sm"
                onClick={onHighlight}
                className="h-8 px-2 text-xs gap-1.5"
            >
                <Highlighter className="w-3.5 h-3.5" />
                Highlight
            </Button>
            <div className="w-px bg-border my-1" />
            <Button
                variant="ghost"
                size="sm"
                onClick={onAskCopilot}
                className="h-8 px-2 text-xs gap-1.5 hover:text-primary"
            >
                <MessageCircle className="w-3.5 h-3.5" />
                Ask Copilot
            </Button>
        </div>
    )
}
