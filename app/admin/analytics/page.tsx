/**
 * Analytics Page
 * Detailed analytics and reporting
 */

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsageChart } from '@/components/admin/usage-chart'

export const metadata = {
  title: 'Analytics | Admin Dashboard',
  description: 'Detailed institutional analytics',
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into platform usage and performance
        </p>
      </div>

      {/* Analytics tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Suspense fallback={<ChartSkeleton />}>
              <UsageChart />
            </Suspense>
            <Card>
              <CardHeader>
                <CardTitle>Tool Usage</CardTitle>
                <CardDescription>Most popular features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ToolUsageBar tool="Find Sources" usage={89} />
                  <ToolUsageBar tool="Insert Citation" usage={76} />
                  <ToolUsageBar tool="Export PDF" usage={65} />
                  <ToolUsageBar tool="Check Integrity" usage={54} />
                  <ToolUsageBar tool="Generate Quiz" usage={43} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Metrics</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ToolUsageBar({ tool, usage }: { tool: string; usage: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{tool}</span>
        <span className="text-muted-foreground">{usage}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${usage}%` }}
        />
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-80 rounded-lg bg-muted animate-pulse" />
}
