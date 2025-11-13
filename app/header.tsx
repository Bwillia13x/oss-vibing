import { ToggleWelcome } from '@/components/modals/welcome'
import { VercelDashed } from '@/components/icons/vercel-dashed'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { HelpCircle, Settings } from 'lucide-react'

interface Props {
  className?: string
}

export async function Header({ className }: Props) {
  return (
    <header className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center">
        <VercelDashed className="ml-1 md:ml-2.5 mr-1.5" />
        <span className="hidden md:inline text-sm uppercase font-mono font-bold tracking-tight">
          Vibe University
        </span>
      </div>
      <div className="flex items-center ml-auto space-x-1.5">
        <Button
          variant="ghost"
          size="icon"
          title="Help & Documentation"
          aria-label="Help & Documentation"
          className="hidden md:flex"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Settings"
          aria-label="Settings"
          className="hidden md:flex"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        <ToggleWelcome />
      </div>
    </header>
  )
}
