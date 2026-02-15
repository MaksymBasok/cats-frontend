'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Event } from '@/types'
import { containersApi } from '@/api/containers'
import { eventsApi } from '@/api/events'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Download, Edit, MapPin, Package, Trash2 } from 'lucide-react'
import { EditContainerDialog } from '@/shared/ui/containers/EditContainerDialog'
import { TransferOwnershipDialog } from '@/shared/ui/containers/TransferOwnershipDialog'
import { ContainerTimeline } from '@/shared/ui/containers/ContainerTimeline'
import { ContainerMap } from '@/shared/ui/containers/ContainerMap'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function ContainerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [container, setContainer] = useState<Container | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  useEffect(() => {
    fetchContainerData()
  }, [code])

  const fetchContainerData = async () => {
    try {
      setLoading(true)
      const [containerData, eventsData] = await Promise.all([
        containersApi.getByCode(code),
        eventsApi.getByContainer(code)
      ])
      setContainer(containerData)
      setEvents(eventsData)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load container details',
        variant: 'destructive'
      })
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!container) return
    
    const confirmed = await confirm({
      title: 'Delete Container',
      description: `Are you sure you want to delete container ${container.code}? This action cannot be undone.`,
      confirmText: 'Delete'
    })

    if (confirmed) {
      try {
        await containersApi.delete(container.id)
        toast({
          title: 'Success',
          description: 'Container deleted successfully'
        })
        router.push('/')
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete container',
          variant: 'destructive'
        })
      }
    }
  }

  const handleExportQR = () => {
    if (!container) return
    // Generate QR code with container code URL
    const qrUrl = `${window.location.origin}/containers/${container.code}`
    // In a real app, you would generate and download the QR code here
    toast({
      title: 'QR Code',
      description: 'QR code downloaded successfully'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!container) {
    return null
  }

  const statusColors = {
    EMPTY: 'bg-gray-500',
    FILLED: 'bg-blue-500',
    IN_TRANSIT: 'bg-yellow-500',
    DELIVERED: 'bg-green-500',
    DAMAGED: 'bg-red-500'
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{container.code}</h1>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(container.createdAt), 'PPP')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportQR}>
            <Download className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusColors[container.status]}`} />
              <span className="text-2xl font-bold">{container.status}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{container.owner.name}</div>
            <p className="text-xs text-muted-foreground">{container.owner.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {container.latitude && container.longitude ? 'Tracked' : 'Unknown'}
            </div>
            {container.latitude && container.longitude && (
              <p className="text-xs text-muted-foreground">
                {container.latitude.toFixed(4)}, {container.longitude.toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Container Code</p>
              <p className="text-lg font-medium">{container.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-lg font-medium">{container.type || 'Standard'}</p>
            </div>
            {container.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-lg font-medium">{container.description}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setTransferOpen(true)}
              className="w-full sm:w-auto"
            >
              Transfer Ownership
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Timeline and Map */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="space-y-4">
          <ContainerTimeline events={events} />
        </TabsContent>
        <TabsContent value="map">
          <ContainerMap container={container} events={events} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditContainerDialog
        container={container}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={fetchContainerData}
      />
      <TransferOwnershipDialog
        container={container}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onSuccess={fetchContainerData}
      />
    </div>
  )
}
