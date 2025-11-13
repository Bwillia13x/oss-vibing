/**
 * Users Table Component
 * Displays list of users with filtering and actions
 */

'use client'

import { useState } from 'react'
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
import { MoreHorizontal, Search, Pencil, Trash2, Ban, CheckCircle } from 'lucide-react'
import { UserFormDialog } from './user-form-dialog'
import { DeleteUserDialog } from './delete-user-dialog'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  department: string
  lastActive: string
  status: 'active' | 'inactive'
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.johnson@university.edu',
    role: 'student',
    department: 'Computer Science',
    lastActive: '2 hours ago',
    status: 'active',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob.smith@university.edu',
    role: 'instructor',
    department: 'Mathematics',
    lastActive: '1 day ago',
    status: 'active',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol.davis@university.edu',
    role: 'student',
    department: 'Biology',
    lastActive: '5 minutes ago',
    status: 'active',
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@university.edu',
    role: 'admin',
    department: 'IT Services',
    lastActive: '30 minutes ago',
    status: 'active',
  },
  {
    id: '5',
    name: 'Eve Martinez',
    email: 'eve.martinez@university.edu',
    role: 'student',
    department: 'Chemistry',
    lastActive: '3 days ago',
    status: 'inactive',
  },
]

export function UsersTable() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleCreateUser = async (userData: Omit<User, 'id' | 'lastActive' | 'status'>) => {
    // TODO: Call API to create user
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      lastActive: 'Just now',
      status: 'active',
    }
    setUsers([...users, newUser])
  }

  const handleUpdateUser = async (userData: Omit<User, 'id' | 'lastActive' | 'status'>) => {
    // TODO: Call API to update user
    if (!editingUser) return
    
    const previousUsers = [...users]
    
    try {
      // Optimistically update UI
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...userData }
          : user
      ))
      setEditingUser(null)
      
      // When API is implemented:
      // await updateUserApi(editingUser.id, userData)
    } catch (error) {
      // Revert on error
      setUsers(previousUsers)
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    // TODO: Call API to delete user
    const previousUsers = [...users]
    
    try {
      // Optimistically update UI
      setUsers(users.filter(user => user.id !== userId))
      
      // When API is implemented:
      // await deleteUserApi(userId)
    } catch (error) {
      // Revert on error
      setUsers(previousUsers)
      throw error
    }
  }

  const handleToggleStatus = async (userId: string) => {
    // TODO: Call API to toggle user status
    const previousUsers = [...users]
    
    try {
      // Optimistically update UI
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' as const }
          : user
      ))
      
      // When API is implemented:
      // await toggleUserStatusApi(userId)
    } catch (error) {
      // Revert on error
      setUsers(previousUsers)
      throw error
    }
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

      {/* Table */}
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
            {filteredUsers.map((user) => (
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>

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
