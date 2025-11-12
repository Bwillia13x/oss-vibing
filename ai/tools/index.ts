import type { InferUITools, UIMessage, UIMessageStreamWriter } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { createSandbox } from './create-sandbox'
import { generateFiles } from './generate-files'
import { getSandboxURL } from './get-sandbox-url'
import { runCommand } from './run-command'
import { outlineDoc } from './outline-doc'
import { findSources } from './find-sources'
import { checkIntegrity } from './check-integrity'
import { sheetAnalyze } from './sheet-analyze'
import { deckGenerate } from './deck-generate'
import { notesToFlashcards } from './notes-to-flashcards'

interface Params {
  modelId: string
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export function tools({ modelId, writer }: Params) {
  return {
    // Core sandbox tools
    createSandbox: createSandbox({ writer }),
    generateFiles: generateFiles({ writer, modelId }),
    getSandboxURL: getSandboxURL({ writer }),
    runCommand: runCommand({ writer }),
    
    // Academic workflow tools
    outlineDoc: outlineDoc({ writer }),
    findSources: findSources({ writer }),
    checkIntegrity: checkIntegrity({ writer }),
    sheetAnalyze: sheetAnalyze({ writer }),
    deckGenerate: deckGenerate({ writer }),
    notesToFlashcards: notesToFlashcards({ writer }),
  }
}

export type ToolSet = InferUITools<ReturnType<typeof tools>>
