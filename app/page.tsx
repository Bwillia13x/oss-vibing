import dynamic from 'next/dynamic'
import { Header } from './header'
import { TabContent, TabItem } from '@/components/tabs'
import { cookies } from 'next/headers'
import { getHorizontal, getVertical } from '@/components/layout/sizing'
import { hideBanner } from '@/app/actions'

// Lazy load heavy components for better performance
const Chat = dynamic(() => import('./chat').then(mod => ({ default: mod.Chat })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Chat...</div>
})
const FileExplorer = dynamic(() => import('./file-explorer').then(mod => ({ default: mod.FileExplorer })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Explorer...</div>
})
const Preview = dynamic(() => import('./preview').then(mod => ({ default: mod.Preview })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Preview...</div>
})
const Logs = dynamic(() => import('./logs').then(mod => ({ default: mod.Logs })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Logs...</div>
})
const Horizontal = dynamic(() => import('@/components/layout/panels').then(mod => ({ default: mod.Horizontal })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Layout...</div>
})
const Vertical = dynamic(() => import('@/components/layout/panels').then(mod => ({ default: mod.Vertical })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Layout...</div>
})
const OnboardingWizard = dynamic(() => import('@/components/onboarding/wizard').then(mod => ({ default: mod.OnboardingWizard })), {
  loading: () => <div className="flex items-center justify-center h-full">Loading Onboarding Wizard...</div>
})

export default async function Page() {
  const store = await cookies()
  const banner = store.get('banner-hidden')?.value !== 'true'
  const horizontalSizes = getHorizontal(store)
  const verticalSizes = getVertical(store)
  return (
    <>
      <OnboardingWizard />
      <div className="flex flex-col h-screen max-h-screen overflow-hidden p-2 space-x-2">
        <Header className="flex items-center w-full" />
        <ul className="flex space-x-5 font-mono text-sm tracking-tight px-1 py-2 md:hidden">
          <TabItem tabId="chat">Student Copilot</TabItem>
          <TabItem tabId="preview">Artifact Preview</TabItem>
          <TabItem tabId="file-explorer">Artifacts</TabItem>
          <TabItem tabId="logs">Provenance & Runs</TabItem>
        </ul>

        {/* Mobile layout tabs taking the whole space*/}
        <div className="flex flex-1 w-full overflow-hidden pt-2 md:hidden">
          <TabContent tabId="chat" className="flex-1">
            <Chat className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="preview" className="flex-1">
            <Preview className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="file-explorer" className="flex-1">
            <FileExplorer className="flex-1 overflow-hidden" />
          </TabContent>
          <TabContent tabId="logs" className="flex-1">
            <Logs className="flex-1 overflow-hidden" />
          </TabContent>
        </div>

        {/* Desktop layout with horizontal and vertical panels */}
        <div className="hidden flex-1 w-full min-h-0 overflow-hidden pt-2 md:flex">
          <Horizontal
            defaultLayout={horizontalSizes ?? [50, 50]}
            left={<Chat className="flex-1 overflow-hidden" />}
            right={
              <Vertical
                defaultLayout={verticalSizes ?? [33.33, 33.33, 33.33]}
                top={<Preview className="flex-1 overflow-hidden" />}
                middle={<FileExplorer className="flex-1 overflow-hidden" />}
                bottom={<Logs className="flex-1 overflow-hidden" />}
              />
            }
          />
        </div>
      </div>
    </>
  )
}
