'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types'
import { usersApi } from '@/api/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { Search, UserCheck, UserX, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '@/shared/auth/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: number) => {
    try {
      await usersApi.approve(userId)
      toast({
        title: 'Success',
        description: 'User approved successfully'
      })
      fetchUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive'
      })
    }
  }

  const handleReject = async (userId: number) => {
    const confirmed = await confirm({
      title: 'Reject User',
      description: 'Are you sure you want to reject this user?',
      confirmText: 'Reject'
    })

    if (confirmed) {
      try {
        await usersApi.reject(userId)
        toast({
          title: 'Success',
          description: 'User rejected successfully'
        })
        fetchUsers()
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to reject user',
          variant: 'destructive'
        })
      }
    }
  }

  const handleMakeAdmin = async (userId: number) => {
    const confirmed = await confirm({
      title: 'Make Admin',
      description: 'Are you sure you want to give this user admin privileges?',
      confirmText: 'Confirm'
    })

    if (confirmed) {
      try {
        await usersApi.makeAdmin(userId)
        toast({
          title: 'Success',
          description: 'User is now an admin'
        })
        fetchUsers()
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update user role',
          variant: 'destructive'
        })
      }
    }
  }

  const handleDelete = async (userId: number) => {
    const confirmed = await confirm({
      title: 'Delete User',
      description: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete'
    })

    if (confirmed) {
      try {
        await usersApi.delete(userId)
        toast({
          title: 'Success',
          description: 'User deleted successfully'
        })
        fetchUsers()
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete user',
          variant: 'destructive'
        })
      }
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const pendingUsers = filteredUsers.filter(u => u.status === 'PENDING')
  const activeUsers = filteredUsers.filter(u => u.status === 'ACTIVE')
  const rejectedUsers = filteredUsers.filter(u => u.status === 'REJECTED')

  if (user?.role !== 'ADMIN') {
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
            <CardTitle>Pending Approvals ({pendingUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(user.id)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(user.id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Reject
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
          <CardTitle>Active Users ({activeUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{u.name}</div>
                  {u.role === 'ADMIN' && (
                    <Badge variant="secondary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
              </div>
              <div className="flex gap-2">
                {u.role !== 'ADMIN' && (
                  <Button size="sm" variant="outline" onClick={() => handleMakeAdmin(u.id)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Make Admin
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {activeUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No active users</p>
          )}
        </CardContent>
      </Card>

      {/* Rejected Users */}
      {rejectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejected Users ({rejectedUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rejectedUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                <div className="flex-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
