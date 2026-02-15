'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContainerDto, ContainerFillDto, ContainerStatus } from '@/shared/types'
import * as containersApi from '@/shared/api/containers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Droplets, Edit, Package, Trash2, X } from 'lucide-react'
import { FillContainerDialog } from '@/shared/ui/containers/FillContainerDialog'
import { EditFillDialog } from '@/shared/ui/containers/EditFillDialog'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function ContainerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [container, setContainer] = useState<ContainerDto | null>(null)
  const [history, setHistory] = useState<ContainerFillDto[]>([])
  const [loading, setLoading] = useState(true)
  const [fillOpen, setFillOpen] = useState(false)
  const [editFillOpen, setEditFillOpen] = useState(false)

  useEffect(() => {
    fetchContainerData()
  }, [code])

  const fetchContainerData = async () => {
    try {
      setLoading(true)
      const containerData = await containersApi.getContainerByCode(code)
      setContainer(containerData)
      
      // Fetch history using container ID
      try {
        const historyData = await containersApi.getContainerHistory(containerData.id)
        setHistory(historyData)
      } catch (historyError) {
        setHistory([])
      }
    } catch (error) {
      toast.error('Не вдалося завантажити дані контейнера')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!container) return
    
    if (!window.confirm(`Видалити контейнер ${container.code}? Цю дію не можна скасувати.`)) {
      return
    }

    try {
      await containersApi.deleteContainer(container.id)
      toast.success('Контейнер видалено')
      router.push('/')
    } catch (error) {
      toast.error('Не вдалося видалити контейнер')
    }
  }

  const handleEmpty = async () => {
    if (!container) return
    
    if (!window.confirm('Спорожнити цей контейнер?')) {
      return
    }

    try {
      await containersApi.emptyContainer(container.id)
      toast.success('Контейнер спорожнено')
      fetchContainerData()
    } catch (error) {
      toast.error('Не вдалося спорожнити контейнер')
    }
  }

  const handleExportQR = () => {
    if (!container) return
    const qrUrl = `${window.location.origin}/containers/${container.code}`
    toast.success('QR код: ' + qrUrl)
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
    [ContainerStatus.Empty]: 'bg-gray-500',
    [ContainerStatus.Full]: 'bg-blue-500',
  }

  const statusLabels = {
    [ContainerStatus.Empty]: 'Порожній',
    [ContainerStatus.Full]: 'Заповнений',
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
              Створено {format(new Date(container.createdAt), 'dd.MM.yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {container.status === ContainerStatus.Empty ? (
            <Button size="sm" onClick={() => setFillOpen(true)} className="bg-brand-navy">
              <Droplets className="h-4 w-4 mr-2" />
              Заповнити
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditFillOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Редагувати
              </Button>
              <Button size="sm" variant="outline" onClick={handleEmpty}>
                <X className="h-4 w-4 mr-2" />
                Спорожнити
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportQR}>
            <Download className="h-4 w-4 mr-2" />
            QR
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Видалити
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Статус</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusColors[container.status]}`} />
              <span className="text-2xl font-bold">{statusLabels[container.status]}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Тип</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{container.containerTypeName}</div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Деталі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Код контейнера</p>
              <p className="text-lg font-medium">{container.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Назва</p>
              <p className="text-lg font-medium">{container.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Об'єм</p>
              <p className="text-lg font-medium">{container.volume} {container.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Тип контейнера</p>
              <p className="text-lg font-medium">{container.containerTypeName}</p>
            </div>
          </div>

          {container.currentFill && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Поточний вміст</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Продукт</p>
                  <p className="text-lg font-medium">{container.currentFill.productName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Кількість</p>
                  <p className="text-lg font-medium">{container.currentFill.quantity} {container.currentFill.unit}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата виробництва</p>
                  <p className="text-lg font-medium">{format(new Date(container.currentFill.productionDate), 'dd.MM.yyyy')}</p>
                </div>
                {container.currentFill.expirationDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Термін придатності</p>
                    <p className="text-lg font-medium">{format(new Date(container.currentFill.expirationDate), 'dd.MM.yyyy')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Історія</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((fill) => (
                <div key={fill.id} className="border-l-2 border-primary pl-4 py-2">
                  <div className="font-medium">{fill.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {fill.quantity} {fill.unit} • {format(new Date(fill.filledAt), 'dd.MM.yyyy HH:mm')}
                  </div>
                  {fill.emptiedAt && (
                    <div className="text-sm text-muted-foreground">
                      Спорожнено: {format(new Date(fill.emptiedAt), 'dd.MM.yyyy HH:mm')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {container.status === ContainerStatus.Empty && (
        <FillContainerDialog
          container={container}
          open={fillOpen}
          onClose={() => setFillOpen(false)}
          onSuccess={fetchContainerData}
        />
      )}
      {container.status === ContainerStatus.Full && (
        <EditFillDialog
          container={container}
          open={editFillOpen}
          onClose={() => setEditFillOpen(false)}
          onSuccess={fetchContainerData}
        />
      )}
    </div>
  )
}
