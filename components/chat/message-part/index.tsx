import type { Metadata } from '@/ai/messages/metadata'
import type { DataPart } from '@/ai/messages/data-parts'
import type { ToolSet } from '@/ai/tools'
import type { UIMessage } from 'ai'
import { GenerateFiles } from './generate-files'
import { CreateSandbox } from './create-sandbox'
import { GetSandboxURL } from './get-sandbox-url'
import { RunCommand } from './run-command'
import { ReportErrors } from './report-errors'
import { Reasoning } from './reasoning'
import { Text } from './text'
import { memo, useEffect } from 'react'
import { DcfResults } from '@/components/panels/DcfResults'
import { useSandboxStore } from '@/app/state'

interface Props {
  part: UIMessage<Metadata, DataPart, ToolSet>['parts'][number]
  partIndex: number
}

export const MessagePart = memo(function MessagePart({
  part,
  partIndex,
}: Props) {
  const addArtifactPaths = useSandboxStore((s) => s.addArtifactPaths)

  useEffect(() => {
    if (part.type === 'data-dcf-result') {
      const d = part.data as any
      const artifacts: string[] = Array.isArray(d?.artifacts)
        ? (d.artifacts as any[]).filter((p): p is string => typeof p === 'string')
        : []
      if (artifacts.length) addArtifactPaths(artifacts)
    }
  }, [part, addArtifactPaths])
  if (part.type === 'data-generating-files') {
    return <GenerateFiles message={part.data} />
  } else if (part.type === 'data-create-sandbox') {
    return <CreateSandbox message={part.data} />
  } else if (part.type === 'data-get-sandbox-url') {
    return <GetSandboxURL message={part.data} />
  } else if (part.type === 'data-run-command') {
    return <RunCommand message={part.data} />
  } else if (part.type === 'reasoning') {
    return <Reasoning part={part} partIndex={partIndex} />
  } else if (part.type === 'data-report-errors') {
    return <ReportErrors message={part.data} />
  } else if (part.type === 'text') {
    return <Text part={part} />
  } else if (part.type === 'data-dcf-result') {
    const d = part.data as any
    return (
      <DcfResults
        assumptions={d.assumptions}
        pvByScenario={d.pvByScenario}
        sensitivity={d.sensitivity}
        artifacts={d.artifacts}
        explain={d.explain}
      />
    )
  }
  return null
})
