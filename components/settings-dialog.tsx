/**
 * Settings Dialog Component
 * User preferences and application settings
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  Palette,
  FileText,
  Bell,
  Shield,
  Keyboard,
  Save,
} from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  compactMode: boolean
  
  // Editor
  autoSave: boolean
  autoSaveInterval: number
  spellCheck: boolean
  grammarCheck: boolean
  citationStyle: 'APA' | 'MLA' | 'Chicago'
  
  // Notifications
  desktopNotifications: boolean
  emailNotifications: boolean
  assignmentReminders: boolean
  
  // Privacy
  analyticsEnabled: boolean
  shareUsageData: boolean
  
  // Keyboard
  vimMode: boolean
  customShortcuts: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  fontSize: 16,
  compactMode: false,
  autoSave: true,
  autoSaveInterval: 30,
  spellCheck: true,
  grammarCheck: true,
  citationStyle: 'APA',
  desktopNotifications: true,
  emailNotifications: false,
  assignmentReminders: true,
  analyticsEnabled: true,
  shareUsageData: false,
  vimMode: false,
  customShortcuts: false,
}

// Load settings from localStorage
function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  
  const stored = localStorage.getItem('vibe-user-settings')
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return DEFAULT_SETTINGS
    }
  }
  return DEFAULT_SETTINGS
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('appearance')
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Apply theme changes using useEffect instead of direct DOM manipulation
  useEffect(() => {
    if (settings.theme !== 'system') {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    }
  }, [settings.theme])

  const handleSave = () => {
    try {
      localStorage.setItem('vibe-user-settings', JSON.stringify(settings))
      setHasChanges(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    setHasChanges(true)
    toast.info('Settings reset to defaults')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Vibe University experience
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="editor">
              <FileText className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="keyboard">
              <Keyboard className="h-4 w-4 mr-2" />
              Keyboard
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[450px] mt-4">
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') =>
                      updateSetting('theme', value)
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fontSize">Font Size: {settings.fontSize}px</Label>
                  </div>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={([value]) => updateSetting('fontSize', value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Adjust the base font size for better readability
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce spacing for a more condensed interface
                    </p>
                  </div>
                  <Switch
                    id="compactMode"
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoSave">Auto Save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save your work while typing
                    </p>
                  </div>
                  <Switch
                    id="autoSave"
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                  />
                </div>

                {settings.autoSave && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="autoSaveInterval">
                      Auto Save Interval: {settings.autoSaveInterval}s
                    </Label>
                    <Slider
                      id="autoSaveInterval"
                      min={10}
                      max={120}
                      step={10}
                      value={[settings.autoSaveInterval]}
                      onValueChange={([value]) => updateSetting('autoSaveInterval', value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="spellCheck">Spell Check</Label>
                    <p className="text-sm text-muted-foreground">
                      Check spelling as you type
                    </p>
                  </div>
                  <Switch
                    id="spellCheck"
                    checked={settings.spellCheck}
                    onCheckedChange={(checked) => updateSetting('spellCheck', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="grammarCheck">Grammar Check</Label>
                    <p className="text-sm text-muted-foreground">
                      Check grammar and style suggestions
                    </p>
                  </div>
                  <Switch
                    id="grammarCheck"
                    checked={settings.grammarCheck}
                    onCheckedChange={(checked) => updateSetting('grammarCheck', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citationStyle">Default Citation Style</Label>
                  <Select
                    value={settings.citationStyle}
                    onValueChange={(value: 'APA' | 'MLA' | 'Chicago') =>
                      updateSetting('citationStyle', value)
                    }
                  >
                    <SelectTrigger id="citationStyle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APA">APA 7th Edition</SelectItem>
                      <SelectItem value="MLA">MLA 9th Edition</SelectItem>
                      <SelectItem value="Chicago">Chicago 17th Edition</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Default citation format for new documents
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications on your desktop
                    </p>
                  </div>
                  <Switch
                    id="desktopNotifications"
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting('desktopNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting('emailNotifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="assignmentReminders">Assignment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders for upcoming assignments
                    </p>
                  </div>
                  <Switch
                    id="assignmentReminders"
                    checked={settings.assignmentReminders}
                    onCheckedChange={(checked) =>
                      updateSetting('assignmentReminders', checked)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analyticsEnabled">Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help us improve by sending anonymous usage data
                    </p>
                  </div>
                  <Switch
                    id="analyticsEnabled"
                    checked={settings.analyticsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting('analyticsEnabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shareUsageData">Share Usage Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymized data to help improve features
                    </p>
                  </div>
                  <Switch
                    id="shareUsageData"
                    checked={settings.shareUsageData}
                    onCheckedChange={(checked) =>
                      updateSetting('shareUsageData', checked)
                    }
                  />
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Data Privacy</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    We take your privacy seriously. All your data is encrypted and stored
                    securely. We comply with FERPA regulations for educational institutions.
                  </p>
                  <Button variant="outline" size="sm">
                    View Privacy Policy
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keyboard" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="vimMode">Vim Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable Vim keybindings in the editor
                    </p>
                  </div>
                  <Switch
                    id="vimMode"
                    checked={settings.vimMode}
                    onCheckedChange={(checked) => updateSetting('vimMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="customShortcuts">Custom Shortcuts</Label>
                    <p className="text-sm text-muted-foreground">
                      Customize keyboard shortcuts (coming soon)
                    </p>
                  </div>
                  <Switch
                    id="customShortcuts"
                    checked={settings.customShortcuts}
                    onCheckedChange={(checked) =>
                      updateSetting('customShortcuts', checked)
                    }
                    disabled
                  />
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Keyboard Shortcuts</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    View all available keyboard shortcuts in the Help dialog (Ctrl+/).
                  </p>
                  <Button variant="outline" size="sm">
                    View Shortcuts
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setHasChanges(false)
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
