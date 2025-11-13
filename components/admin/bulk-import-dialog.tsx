/**
 * Bulk User Import Dialog
 * Import multiple users from CSV file
 */

'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface BulkImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

interface BulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (users: Array<{ name: string; email: string; role: string; department: string }>) => Promise<BulkImportResult>
}

export function BulkImportDialog({ open, onOpenChange, onImport }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    }
  }

  const parseCSV = (text: string): Array<{ name: string; email: string; role: string; department: string }> => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    const nameIndex = headers.indexOf('name')
    const emailIndex = headers.indexOf('email')
    const roleIndex = headers.indexOf('role')
    const departmentIndex = headers.indexOf('department')

    if (nameIndex === -1 || emailIndex === -1 || roleIndex === -1 || departmentIndex === -1) {
      throw new Error('CSV must have columns: name, email, role, department')
    }

    const users = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= 4) {
        users.push({
          name: values[nameIndex],
          email: values[emailIndex],
          role: values[roleIndex],
          department: values[departmentIndex],
        })
      }
    }

    return users
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const users = parseCSV(text)
      const result = await onImport(users)
      setResult(result)
    } catch (error) {
      console.error('Error importing users:', error)
      setResult({
        total: 0,
        successful: 0,
        failed: 0,
        errors: [{ email: 'all', error: error instanceof Error ? error.message : 'Failed to import users' }],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const template = 'name,email,role,department\nJohn Doe,john.doe@university.edu,student,Computer Science\nJane Smith,jane.smith@university.edu,instructor,Mathematics'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'user-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk User Import</DialogTitle>
          <DialogDescription>
            Import multiple users from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template download */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Need a template?</span>
              <Button variant="link" onClick={downloadTemplate} className="h-auto p-0">
                Download CSV Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File upload */}
          {!result && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium mb-1">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV format with columns: name, email, role, department
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-4">
              <Alert variant={result.failed === 0 ? 'default' : 'destructive'}>
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="font-medium mb-2">Import Results</div>
                  <div className="text-sm space-y-1">
                    <div>Total: {result.total} users</div>
                    <div className="text-green-600">Successful: {result.successful}</div>
                    {result.failed > 0 && (
                      <div className="text-red-600">Failed: {result.failed}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  <div className="text-sm font-medium">Errors:</div>
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>{error.email}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Users
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
