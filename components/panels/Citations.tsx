interface Citation {
  readonly source: string
  readonly url?: string
  readonly page?: number
  readonly section?: string
}

interface CitationsProps {
  readonly citations: readonly Citation[]
}

export function Citations({ citations }: CitationsProps) {
  if (citations.length === 0) return null

  return (
    <div className="border rounded-lg p-4 bg-secondary/50">
      <h3 className="font-semibold mb-2">Citations</h3>
      <div className="space-y-2">
        {citations.map((citation, i) => (
          <div key={`${citation.source}-${i}`} className="text-sm">
            <span className="font-medium">{citation.source}</span>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary underline"
              >
                {citation.page ? `Page ${citation.page}` : 'Link'}
              </a>
            )}
            {citation.section && (
              <span className="ml-2 text-muted-foreground">§ {citation.section}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
