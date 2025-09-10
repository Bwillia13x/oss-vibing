import { Button } from '@/components/ui/button'

interface TaskPlanProps {
  readonly steps: readonly string[]
  readonly inputs: Readonly<Record<string, any>>
  readonly onApprove: () => void
  readonly onCancel: () => void
}

export function TaskPlan({ steps, inputs, onApprove, onCancel }: TaskPlanProps) {
  return (
    <div className="border rounded-lg p-4 bg-secondary/50">
      <h3 className="font-semibold mb-2">Task Plan</h3>
      <div className="mb-4">
        <h4 className="font-medium mb-1">Steps:</h4>
        <ol className="list-decimal list-inside space-y-1">
          {steps.map((step, i) => (
            <li key={`${step}-${i}`} className="text-sm">{step}</li>
          ))}
        </ol>
      </div>
      <div className="mb-4">
        <h4 className="font-medium mb-1">Inputs:</h4>
        <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
          {JSON.stringify(inputs, null, 2)}
        </pre>
      </div>
      <div className="flex gap-2">
        <Button onClick={onApprove} size="sm">
          Approve & Run
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  )
}
