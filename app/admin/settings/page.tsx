/**
 * Admin Settings Page - Branding Configuration
 * Allows institutional administrators to customize branding
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Palette, Save, Eye, Loader2, X } from 'lucide-react'
import {
  fetchBrandingSettings,
  updateBrandingSettings,
  uploadLogo,
  deleteLogo,
  type BrandingSettings,
} from '@/lib/api/admin'
import { useInstitutionId } from '@/lib/auth/context'
import { toast } from 'sonner'

export default function SettingsPage() {
  const institutionId = useInstitutionId()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Branding state
  const [settings, setSettings] = useState<BrandingSettings>({
    institutionName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    logoUrl: '',
    customCSS: '',
  })

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchBrandingSettings(institutionId)
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function handleSave() {
    try {
      setSaving(true)
      await updateBrandingSettings(institutionId, settings)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation is first line of defense
    // Note: Server should also validate file content (magic bytes) for security
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB')
      return
    }

    try {
      setUploading(true)
      const logoUrl = await uploadLogo(institutionId, file)
      setSettings(prev => ({ ...prev, logoUrl }))
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  async function handleLogoDelete() {
    try {
      await deleteLogo(institutionId)
      setSettings(prev => ({ ...prev, logoUrl: '' }))
      toast.success('Logo deleted successfully')
    } catch (error) {
      console.error('Failed to delete logo:', error)
      toast.error('Failed to delete logo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branding Settings</h1>
          <p className="text-muted-foreground">
            Customize your institution&apos;s appearance and branding
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4">
          {/* Institution Name */}
          <Card>
            <CardHeader>
              <CardTitle>Institution Information</CardTitle>
              <CardDescription>
                Basic information about your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  value={settings.institutionName}
                  onChange={(e) => setSettings(prev => ({ ...prev, institutionName: e.target.value }))}
                  placeholder="Example University"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Upload your institution&apos;s logo (PNG, JPG, max 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.logoUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-lg border overflow-hidden">
                    <Image
                      src={settings.logoUrl}
                      alt="Institution logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current logo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogoDelete}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 rounded-lg border flex items-center justify-center bg-muted">
                    <Palette className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No logo uploaded</p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="logo">Upload New Logo</Label>
                <div className="mt-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                    Uploading...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize your institution&apos;s primary and secondary colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="h-10 w-20"
                    />
                    <Input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: settings.primaryColor }}
                />
                <div
                  className="h-12 flex-1 rounded"
                  style={{ backgroundColor: settings.secondaryColor }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom CSS */}
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS (Advanced)</CardTitle>
              <CardDescription>
                Add custom CSS to further customize the appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={settings.customCSS || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, customCSS: e.target.value }))}
                placeholder="/* Custom CSS here */"
                className="w-full h-32 rounded-md border p-3 font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your branding will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-8 space-y-4">
                {settings.logoUrl && (
                  <div className="flex justify-center relative h-16">
                    <Image
                      src={settings.logoUrl}
                      alt="Logo preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-center">
                  {settings.institutionName || 'Institution Name'}
                </h2>
                <div className="flex gap-2 justify-center">
                  <Button style={{ backgroundColor: settings.primaryColor }}>
                    Primary Button
                  </Button>
                  <Button
                    variant="outline"
                    style={{
                      borderColor: settings.secondaryColor,
                      color: settings.secondaryColor,
                    }}
                  >
                    Secondary Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
