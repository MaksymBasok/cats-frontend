'use client'

import { Event } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  User
} from 'lucide-react'

interface ContainerTimelineProps {
  events: Event[]
}

const eventIcons = {
  STATUS_CHANGE: Package,
  LOCATION_UPDATE: MapPin,
  OWNERSHIP_TRANSFER: User,
  CREATED: CheckCircle,
  UPDATED: Package,
  SCANNED: Truck
}

const eventColors = {
  STATUS_CHANGE: 'bg-blue-500',
  LOCATION_UPDATE: 'bg-green-500',
  OWNERSHIP_TRANSFER: 'bg-purple-500',
  CREATED: 'bg-gray-500',
  UPDATED: 'bg-yellow-500',
  SCANNED: 'bg-orange-500'
}

export function ContainerTimeline({ events }: ContainerTimelineProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No events recorded yet</p>
        </CardContent>
      </Card>
    )
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {sortedEvents.map((event, index) => {
            const Icon = eventIcons[event.type] || Package
            const colorClass = eventColors[event.type] || 'bg-gray-500'

            return (
              <div key={event.id} className="relative flex gap-4 items-start">
                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{event.type.replace(/_/g, ' ')}</h4>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), 'PPp')}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {event.performedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      by {event.performedBy.name}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
