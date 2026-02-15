'use client'

import { Container, Event } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface ContainerMapProps {
  container: Container
  events: Event[]
}

export function ContainerMap({ container, events }: ContainerMapProps) {
  const hasLocation = container.latitude && container.longitude

  // Get location events
  const locationEvents = events.filter(
    e => e.type === 'LOCATION_UPDATE' && e.metadata?.latitude && e.metadata?.longitude
  )

  if (!hasLocation && locationEvents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No location data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Current Location */}
        {hasLocation && (
          <div>
            <h3 className="font-medium mb-2">Current Location</h3>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Latest Position</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Latitude: {container.latitude?.toFixed(6)}
              </p>
              <p className="text-sm text-muted-foreground">
                Longitude: {container.longitude?.toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps?q=${container.latitude},${container.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-block mt-2"
              >
                View on Google Maps →
              </a>
            </div>
          </div>
        )}

        {/* Location History */}
        {locationEvents.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Location History</h3>
            <div className="space-y-2">
              {locationEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${event.metadata?.latitude},${event.metadata?.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {event.metadata?.latitude}, {event.metadata?.longitude}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Interactive map with route visualization coming soon
        </p>
      </CardContent>
    </Card>
  )
}
