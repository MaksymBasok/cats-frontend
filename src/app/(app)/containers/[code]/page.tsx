'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContainerDto, ContainerFillDto, ContainerStatus } from '@/shared/types'
import * as containersApi from '@/shared/api/containers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Download, Edit, MapPin, Package, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function ContainerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { toast } = useToast()

  const [container, setContainer] = useState<ContainerDto | null>(null)
  const [history, setHistory] = useState<ContainerFillDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContainerData()
  }, [code])

  const fetchContainerData = async () => {
    try {
      setLoading(true)
      const [containerData, historyData] = await Promise.all([
        containersApi.getContainerByCode(code),
        containersApi.getContainerHistory(code).catch(() => [])
      ])
      setContainer(containerData)
      setHistory(historyData)
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити дані контейнера',
        variant: 'destructive'
      })
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
      toast({
        title: 'Успіх',
        description: 'Контейнер видалено'
      })
      router.push('/')
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити контейнер',
        variant: 'destructive'
      })
    }
  }

  const handleExportQR = () => {
    if (!container) return
    const qrUrl = `${window.location.origin}/containers/${container.code}`
    toast({
      title: 'QR Код',
      description: 'QR код збережено'
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportQR}>
            <Download className="h-4 w-4 mr-2" />
            QR Код
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
    </div>
  )
}
