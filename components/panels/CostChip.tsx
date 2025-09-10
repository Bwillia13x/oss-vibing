interface CostChipProps {
  readonly tokens: number
  readonly cost: number
  readonly latencyMs: number
}

export function CostChip({ tokens, cost, latencyMs }: CostChipProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-xs font-medium">
      <span>{tokens} tokens</span>
      <span>•</span>
      <span>${cost.toFixed(4)}</span>
      <span>•</span>
      <span>{latencyMs}ms</span>
    </div>
  )
}
