/**
 * Users Table Component
 * Displays list of users with filtering and actions
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Search, Pencil, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react'
import { UserFormDialog } from './user-form-dialog'
import { DeleteUserDialog } from './delete-user-dialog'
import { fetchUsers, updateUser, deleteUser, type User as ApiUser } from '@/lib/api/admin-users'
import { useInstitutionId } from '@/lib/auth/context'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  department: string
  lastActive: string
  status: 'active' | 'inactive'
}

// Map API user to display user
function mapApiUserToDisplayUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: (apiUser.role === 'INSTRUCTOR' ? 'instructor' : 
           apiUser.role === 'ADMIN' ? 'admin' : 'student') as 'student' | 'instructor' | 'admin',
    department: 'N/A', // Not available in API response
    lastActive: 'N/A', // Not available in API response
    status: 'active', // Assume active by default
  }
}

export function UsersTable() {
  const institutionId = useInstitutionId()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Fetch users on component mount and when role filter changes
  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  async function loadUsers() {
    try {
      setLoading(true)
      const result = await fetchUsers(institutionId, {
        role: roleFilter !== 'all' ? roleFilter.toUpperCase() : undefined,
      })
      setUsers(result.data.map(mapApiUserToDisplayUser))
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users. Please try again.')
      // Keep existing users on error
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreateUser = async (userData: Omit<User, 'id' | 'lastActive' | 'status'>) => {
    try {
      // Note: createUser is called from the parent page component
      // This is just for the form dialog
      await loadUsers()
      toast.success('User created successfully')
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
      throw error
    }
  }

  const handleUpdateUser = async (userData: Omit<User, 'id' | 'lastActive' | 'status'>) => {
    if (!editingUser) return
    
    try {
      await updateUser(editingUser.id, {
        name: userData.name,
        email: userData.email,
        role: userData.role.toUpperCase(),
      })
      
      // Reload users to get fresh data
      await loadUsers()
      setEditingUser(null)
      toast.success('User updated successfully')
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      
      // Reload users to get fresh data
      await loadUsers()
      toast.success('User deleted successfully')
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
      throw error
    }
  }

  const handleToggleStatus = async (userId: string) => {
    // Note: The API doesn't currently support status toggle
    // This would need to be implemented in the backend
    toast.info('Status toggle not yet implemented in the API')
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="instructor">Instructors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.department}</TableCell>
                <TableCell className="text-muted-foreground">{user.lastActive}</TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditDialog(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                        {user.status === 'active' ? (
                          <>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend User
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate User
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination info */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {/* Dialogs */}
      <UserFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingUser(null)
        }}
        user={editingUser || undefined}
        onSave={editingUser ? handleUpdateUser : handleCreateUser}
      />

      {deletingUser && (
        <DeleteUserDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          user={deletingUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  )
}
