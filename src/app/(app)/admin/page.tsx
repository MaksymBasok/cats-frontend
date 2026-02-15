'use client'

import { useEffect, useState } from 'react'
import { UserDto, UserRole } from '@/shared/types'
import * as usersApi from '@/shared/api/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Search, UserCheck, UserX, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchUsers()
  }, [isAdmin, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getUsers()
      setUsers(data)
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити користувачів',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      await usersApi.activateUser(userId)
      toast({
        title: 'Успіх',
        description: 'Користувача підтверджено'
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося підтвердити користувача',
        variant: 'destructive'
      })
    }
  }

  const handleReject = async (userId: string) => {
    if (!window.confirm('Відхилити цього користувача?')) return

    try {
      await usersApi.deactivateUser(userId)
      toast({
        title: 'Успіх',
        description: 'Користувача відхилено'
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося відхилити користувача',
        variant: 'destructive'
      })
    }
  }

  const handleMakeAdmin = async (userId: string) => {
    if (!window.confirm('Надати цьому користувачу права адміністратора?')) return

    try {
      await usersApi.updateUser(userId, { role: UserRole.Admin })
      toast({
        title: 'Успіх',
        description: 'Користувач тепер адміністратор'
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити роль користувача',
        variant: 'destructive'
      })
    }
  }

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingUsers = filteredUsers.filter(u => !u.isActive)
  const activeUsers = filteredUsers.filter(u => u.isActive)

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Очікують підтвердження ({pendingUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(u.id)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Підтвердити
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(u.id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Відхилити
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Активні користувачі ({activeUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  {u.role === UserRole.Admin && (
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Адмін
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </div>
              <div className="flex gap-2">
                {u.role !== UserRole.Admin && (
                  <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Зробити адміном
                  </Button>
                )}
              </div>
            </div>
          ))}
          {activeUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Немає активних користувачів</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
