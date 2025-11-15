import { cn } from '@/lib/utils'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

/**
 * Skeleton loader component for progressive loading states
 * Provides visual feedback while content is loading
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  )
}
