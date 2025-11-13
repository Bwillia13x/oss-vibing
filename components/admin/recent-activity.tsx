/**
 * Recent Activity Component
 * Shows recent user activities and events
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// Mock data - in production, fetch from API
async function getRecentActivity() {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  return [
    {
      id: '1',
      user: 'Alice Johnson',
      userInitials: 'AJ',
      action: 'created a new document',
      target: 'Research Paper on Climate Change',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
    {
      id: '2',
      user: 'Bob Smith',
      userInitials: 'BS',
      action: 'submitted assignment',
      target: 'Lab Report #3',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
    {
      id: '3',
      user: 'Carol Davis',
      userInitials: 'CD',
      action: 'added 12 citations to',
      target: 'Literature Review',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: '4',
      user: 'David Wilson',
      userInitials: 'DW',
      action: 'exported document',
      target: 'Final Paper.pdf',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    },
    {
      id: '5',
      user: 'Eve Martinez',
      userInitials: 'EM',
      action: 'completed integrity check for',
      target: 'Essay Draft v2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  ]
}

export async function RecentActivity() {
  const activities = await getRecentActivity()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest user actions across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
