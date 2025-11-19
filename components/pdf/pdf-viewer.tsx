'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    PdfLoader,
    PdfHighlighter,
    Tip,
    Highlight,
    Popup,
    AreaHighlight,
} from 'react-pdf-highlighter'
import { HighlightPopover } from './highlight-popover'
import { useSharedChatContext } from '@/lib/chat-context'
import { Loader2 } from 'lucide-react'

interface Props {
    url: string
}

interface IHighlight {
    content: { text?: string; image?: string }
    position: {
        boundingRect: {
            x1: number
            y1: number
            x2: number
            y2: number
            width: number
            height: number
        }
        rects: {
            x1: number
            y1: number
            x2: number
            y2: number
            width: number
            height: number
        }[]
        pageNumber: number
    }
    comment: { text: string; emoji: string }
    id: string
}

export function PdfViewer({ url }: Props) {
    const [highlights, setHighlights] = useState<Array<IHighlight>>([])
    const { chat } = useSharedChatContext()

    const addHighlight = (highlight: IHighlight) => {
        console.log('Saving highlight', highlight)
        setHighlights([{ ...highlight, id: Math.random().toString(36).slice(2) }, ...highlights])
    }

    const handleAskCopilot = (content: string) => {
        if (!chat) return
        // Append to chat input (this assumes we have a way to set input, 
        // or we can just send it directly if that's the desired UX)
        // For now, let's simulate "pasting" into the prompt
        const event = new CustomEvent('vibe-paste-prompt', { detail: `Context from PDF: "${content}"\n\nQuestion: ` })
        window.dispatchEvent(event)
    }

    return (
        <div className="h-full w-full relative bg-muted/10">
            <PdfLoader url={url} beforeLoad={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-muted-foreground" /></div>}>
                {(pdfDocument) => (
                    <PdfHighlighter
                        pdfDocument={pdfDocument}
                        enableAreaSelection={(event) => event.altKey}
                        onScrollChange={() => { }}
                        scrollRef={() => { }}
                        onSelectionFinished={(
                            position,
                            content,
                            hideTipAndSelection,
                            transformSelection
                        ) => (
                            <Tip
                                onOpen={transformSelection}
                                onConfirm={(comment) => {
                                    addHighlight({ content, position, comment, id: '' })
                                    hideTipAndSelection()
                                }}
                            >
                                <HighlightPopover
                                    onHighlight={() => {
                                        addHighlight({ content, position, comment: { text: '', emoji: '' }, id: '' })
                                        hideTipAndSelection()
                                    }}
                                    onAskCopilot={() => {
                                        if (content.text) handleAskCopilot(content.text)
                                        hideTipAndSelection()
                                    }}
                                />
                            </Tip>
                        )}
                        highlightTransform={(
                            highlight,
                            index,
                            setTip,
                            hideTip,
                            viewportToScaled,
                            screenshot,
                            isScrolledTo
                        ) => {
                            const isTextHighlight = !highlight.content.image
                            const component = isTextHighlight ? (
                                <Highlight
                                    isScrolledTo={isScrolledTo}
                                    position={highlight.position}
                                    comment={highlight.comment}
                                />
                            ) : (
                                <AreaHighlight
                                    isScrolledTo={isScrolledTo}
                                    highlight={highlight}
                                    onChange={(boundingRect) => {
                                        // update highlight
                                    }}
                                />
                            )

                            return (
                                <Popup
                                    popupContent={<div className="p-2 bg-background border rounded shadow text-xs">Highlight</div>}
                                    onMouseOver={(popupContent) => setTip(highlight, (highlight) => popupContent)}
                                    onMouseOut={hideTip}
                                    key={index}
                                    children={component}
                                />
                            )
                        }}
                        highlights={highlights}
                    />
                )}
            </PdfLoader>
        </div>
    )
}
