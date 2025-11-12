import type { InferUITools, UIMessage, UIMessageStreamWriter } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { createSandbox } from './create-sandbox'
import { generateFiles } from './generate-files'
import { getSandboxURL } from './get-sandbox-url'
import { runCommand } from './run-command'
import { outlineDoc } from './outline-doc'
import { findSources } from './find-sources'
import { insertCitations } from './insert-citations'
import { summarizePdf } from './summarize-pdf'
import { paraphraseWithCitation } from './paraphrase-with-citation'
import { formatBibliography } from './format-bibliography'
import { checkIntegrity } from './check-integrity'
import { verifyCitations } from './verify-citations'
import { sheetAnalyze } from './sheet-analyze'
import { sheetChart } from './sheet-chart'
import { deckGenerate } from './deck-generate'
import { notesToFlashcards } from './notes-to-flashcards'
import { reviewFlashcards } from './review-flashcards'
import { planSchedule } from './plan-schedule'
import { exportArtifact } from './export-artifact'

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
    insertCitations: insertCitations({ writer }),
    summarizePdf: summarizePdf({ writer }),
    paraphraseWithCitation: paraphraseWithCitation({ writer }),
    formatBibliography: formatBibliography({ writer }),
    checkIntegrity: checkIntegrity({ writer }),
    verifyCitations: verifyCitations({ writer }),
    sheetAnalyze: sheetAnalyze({ writer }),
    sheetChart: sheetChart({ writer }),
    deckGenerate: deckGenerate({ writer }),
    notesToFlashcards: notesToFlashcards({ writer }),
    reviewFlashcards: reviewFlashcards({ writer }),
    planSchedule: planSchedule({ writer }),
    exportArtifact: exportArtifact({ writer }),
  }
}

export type ToolSet = InferUITools<ReturnType<typeof tools>>
