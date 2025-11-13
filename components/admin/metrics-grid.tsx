/**
 * Metrics Grid Component
 * Displays key institutional metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, TrendingUp, CheckCircle } from 'lucide-react'

// Mock data - in production, fetch from API
async function getMetrics() {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return {
    totalUsers: 1234,
    activeUsers: 856,
    totalDocuments: 4567,
    integrityScore: 94,
  }
}

export async function MetricsGrid() {
  const metrics = await getMetrics()

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers.toLocaleString(),
      icon: Users,
      description: `${metrics.activeUsers} active this month`,
      trend: '+12%',
    },
    {
      title: 'Documents Created',
      value: metrics.totalDocuments.toLocaleString(),
      icon: FileText,
      description: 'Across all users',
      trend: '+8%',
    },
    {
      title: 'Avg. Integrity Score',
      value: `${metrics.integrityScore}%`,
      icon: CheckCircle,
      description: 'Citation quality',
      trend: '+2%',
    },
    {
      title: 'Monthly Growth',
      value: '+156',
      icon: TrendingUp,
      description: 'New users this month',
      trend: '+24%',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              <p className="text-xs font-medium text-green-600 mt-1">
                {metric.trend} from last month
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
