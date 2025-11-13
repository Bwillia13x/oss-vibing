/**
 * Admin Settings Page - Branding Configuration
 * Allows institutional administrators to customize branding
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Palette, Upload, Globe, Mail, Save, Eye } from 'lucide-react'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Branding state
  const [institutionName, setInstitutionName] = useState('Example University')
  const [customDomain, setCustomDomain] = useState('university.vibeuniversity.edu')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6')
  const [supportEmail, setSupportEmail] = useState('support@example.edu')
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome to Example University\'s Academic Platform')

  const handleSave = async () => {
    setSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setShowSuccess(true)
    setSaving(false)
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In production, upload to storage and get URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your institution's branding and configuration
        </p>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Globe className="mr-2 h-4 w-4" />
            Domain
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Colors</CardTitle>
              <CardDescription>
                Customize your institution's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Institution Name */}
              <div className="space-y-2">
                <Label htmlFor="institution-name">Institution Name</Label>
                <Input
                  id="institution-name"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Example University"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo">Institution Logo</Label>
                <div className="flex items-center gap-4">
                  {logoUrl && (
                    <div className="h-16 w-16 rounded-lg border bg-white p-2">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Recommended: PNG or SVG, max 500KB
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Scheme */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-20 cursor-pointer"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Input
                  id="welcome-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Welcome to your academic platform"
                />
                <p className="text-sm text-muted-foreground">
                  Displayed on the login and welcome pages
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="rounded-lg border p-6"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`
                  }}
                >
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
                        {institutionName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {welcomeMessage}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button style={{ backgroundColor: primaryColor, color: 'white' }}>
                      Primary Button
                    </Button>
                    <Button 
                      variant="outline"
                      style={{ borderColor: secondaryColor, color: secondaryColor }}
                    >
                      Secondary Button
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Tab */}
        <TabsContent value="domain" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>
                Configure a custom domain for your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="university.vibeuniversity.edu"
                />
                <p className="text-sm text-muted-foreground">
                  Contact support to configure DNS settings
                </p>
              </div>

              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current domain:</strong> {customDomain}
                  <br />
                  <span className="text-sm">
                    DNS Status: {customDomain.includes('vibeuniversity') ? '✓ Active' : '⚠ Pending configuration'}
                  </span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Customize email templates and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@example.edu"
                />
                <p className="text-sm text-muted-foreground">
                  Used as the "Reply-To" address in system emails
                </p>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Email templates will use your branding colors and logo.
                  Custom template editor coming soon.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-between border-t pt-6">
        <Button variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Preview Changes
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
