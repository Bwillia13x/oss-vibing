/**
 * Analytics Page
 * Detailed analytics and reporting
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsageChart } from '@/components/admin/usage-chart'
import { fetchAnalytics, type Analytics } from '@/lib/api/admin'
import { useInstitutionId } from '@/lib/auth/context'
import { toast } from 'sonner'
import { Loader2, Users, TrendingUp, FileText, Zap } from 'lucide-react'

export default function AnalyticsPage() {
  const institutionId = useInstitutionId()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week')

  useEffect(() => {
    loadAnalytics()
  }, [institutionId, period])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const data = await fetchAnalytics({ institutionId, period })
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into platform usage and performance
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="rounded-md border px-3 py-2"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.documentsCreated}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(analytics.documentsCreated / analytics.activeUsers)} per user avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.apiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.cacheHitRate}% cache hit rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              System performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <UsageChart data={analytics.usageOverTime} />
            <Card>
              <CardHeader>
                <CardTitle>Top Features</CardTitle>
                <CardDescription>Most used features this {period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topFeatures.map((feature, index) => (
                    <ToolUsageBar
                      key={index}
                      tool={feature.feature}
                      usage={Math.round((feature.usage / analytics.apiCalls) * 100)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage Details</CardTitle>
              <CardDescription>Detailed breakdown of feature usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{feature.feature}</span>
                    <span className="text-muted-foreground">{feature.usage} calls</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Usage Trends</CardTitle>
              <CardDescription>Activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {/* Chart would go here */}
                <p className="text-muted-foreground">Chart visualization</p>
              </div>
            </CardContent>
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
