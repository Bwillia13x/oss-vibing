/**
 * Admin Dashboard Home
 * Overview of institutional metrics and key statistics
 */

import { Suspense } from 'react'
import { MetricsGrid } from '@/components/admin/metrics-grid'
import { UsageChart } from '@/components/admin/usage-chart'
import { RecentActivity } from '@/components/admin/recent-activity'
import { QuickActions } from '@/components/admin/quick-actions'

export const metadata = {
  title: 'Admin Dashboard | Vibe University',
  description: 'Institutional analytics and management',
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of institutional metrics and student activity
        </p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Key metrics */}
      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsGrid />
      </Suspense>

      {/* Charts and visualizations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <UsageChart />
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}

// Loading skeletons
function MetricsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return <div className="h-80 rounded-lg bg-muted animate-pulse" />
}

function ActivitySkeleton() {
  return <div className="h-80 rounded-lg bg-muted animate-pulse" />
}
