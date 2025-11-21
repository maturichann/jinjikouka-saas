"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type UserRole = 'admin' | 'mg' | 'manager' | 'staff'

type User = {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
  password: string
  createdAt: string
}

// パスワード自動生成関数
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      email: "admin@example.com",
      name: "管理者太郎",
      role: "admin",
      department: "本社",
      password: "admin123",
      createdAt: "2024-01-01"
    },
    {
      id: "2",
      email: "mg@example.com",
      name: "MG花子",
      role: "mg",
      department: "本社",
      password: "mg123",
      createdAt: "2024-01-01"
    },
    {
      id: "3",
      email: "manager@example.com",
      name: "店長太郎",
      role: "manager",
      department: "渋谷店",
      password: "manager123",
      createdAt: "2024-01-01"
    },
    {
      id: "4",
      email: "staff@example.com",
      name: "山田花子",
      role: "staff",
      department: "渋谷店",
      password: "staff123",
      createdAt: "2024-01-01"
    }
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "staff" as UserRole,
    department: ""
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, { variant: "default" | "secondary" | "outline", label: string }> = {
      admin: { variant: "default", label: "管理者" },
      mg: { variant: "default", label: "MG" },
      manager: { variant: "secondary", label: "店長" },
      staff: { variant: "outline", label: "スタッフ" }
    }
    const config = variants[role]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleCreateUser = () => {
    const password = generatePassword()
    const newUserData: User = {
      id: String(users.length + 1),
      ...newUser,
      password,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setUsers([...users, newUserData])
    setGeneratedPassword(password)
    setNewUser({ email: "", name: "", role: "staff", department: "" })

    // パスワード表示のため、すぐにダイアログを閉じない
    setTimeout(() => {
      setIsDialogOpen(false)
      setGeneratedPassword("")
    }, 5000)
  }

  const handleEditUser = () => {
    if (!editingUser) return
    const updatedUsers = users.map(u =>
      u.id === editingUser.id ? editingUser : u
    )
    setUsers(updatedUsers)
    setEditingUser(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm("このユーザーを削除してもよろしいですか？")) {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const handleResetPassword = (userId: string) => {
    const newPassword = generatePassword()
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, password: newPassword } : u
    )
    setUsers(updatedUsers)
    alert(`新しいパスワード: ${newPassword}\n\nこのパスワードをユーザーに伝えてください。`)
  }

  if (!user) return null

  if (user.role !== 'admin') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">この機能は管理者のみがアクセスできます。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ユーザー管理</h1>
          <p className="text-gray-600 mt-2">社員の登録・編集・削除</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>新しいユーザーを追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいユーザーを追加</DialogTitle>
              <DialogDescription>
                ユーザー情報を入力してください。パスワードは自動生成されます。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  placeholder="山田 太郎"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="department">部署</Label>
                <Input
                  id="department"
                  placeholder="営業部"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">役割</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value="staff">スタッフ</option>
                  <option value="manager">店長</option>
                  <option value="mg">MG</option>
                  <option value="admin">管理者</option>
                </select>
              </div>

              {generatedPassword ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-900 mb-2">ユーザーを作成しました！</p>
                  <p className="text-sm text-green-800 mb-2">自動生成されたパスワード:</p>
                  <p className="text-lg font-mono font-bold text-green-900 bg-white p-2 rounded border border-green-300">
                    {generatedPassword}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    このパスワードをユーザーに伝えてください。（5秒後に閉じます）
                  </p>
                </div>
              ) : (
                <Button onClick={handleCreateUser} className="w-full">作成</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>登録されているユーザーの一覧（{users.length}人）</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>部署</TableHead>
                <TableHead>役割</TableHead>
                <TableHead>パスワード</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {u.password}
                    </code>
                  </TableCell>
                  <TableCell>{u.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(u)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(u.id)}
                      >
                        パスワード再発行
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを編集</DialogTitle>
            <DialogDescription>
              ユーザー情報を編集してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">メールアドレス</Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser?.email || ""}
                onChange={(e) => editingUser && setEditingUser({ ...editingUser, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">名前</Label>
              <Input
                id="edit-name"
                value={editingUser?.name || ""}
                onChange={(e) => editingUser && setEditingUser({ ...editingUser, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-department">部署</Label>
              <Input
                id="edit-department"
                value={editingUser?.department || ""}
                onChange={(e) => editingUser && setEditingUser({ ...editingUser, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">役割</Label>
              <select
                id="edit-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editingUser?.role || "staff"}
                onChange={(e) => editingUser && setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
              >
                <option value="staff">スタッフ</option>
                <option value="manager">店長</option>
                <option value="mg">MG</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <Button onClick={handleEditUser} className="w-full">更新</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
