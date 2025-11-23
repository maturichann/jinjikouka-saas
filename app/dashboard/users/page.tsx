"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
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
  staff_code: string
  name: string
  role: UserRole
  department: string
  password_hash: string
  created_at: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [newUser, setNewUser] = useState({
    staff_code: "",
    name: "",
    role: "staff" as UserRole,
    department: ""
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const supabase = createClient()

  // ユーザー一覧を取得
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('ユーザーの取得エラー:', error)
      alert('ユーザーの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const handleCreateUser = async () => {
    // パスワードはスタッフコードと同じ
    const password = newUser.staff_code

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          staff_code: newUser.staff_code,
          name: newUser.name,
          role: newUser.role,
          department: newUser.department,
          password_hash: password
        }])
        .select()

      if (error) throw error

      setGeneratedPassword(password)
      setNewUser({ staff_code: "", name: "", role: "staff", department: "" })

      // ユーザーリストを再取得
      fetchUsers()
    } catch (error) {
      console.error('ユーザーの作成エラー:', error)
      alert('ユーザーの作成に失敗しました')
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          staff_code: editingUser.staff_code,
          name: editingUser.name,
          role: editingUser.role,
          department: editingUser.department
        })
        .eq('id', editingUser.id)

      if (error) throw error

      setEditingUser(null)
      setIsEditDialogOpen(false)

      // ユーザーリストを再取得
      fetchUsers()
    } catch (error) {
      console.error('ユーザーの更新エラー:', error)
      alert('ユーザーの更新に失敗しました')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("このユーザーを削除してもよろしいですか？")) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // ユーザーリストを再取得
      fetchUsers()
    } catch (error) {
      console.error('ユーザーの削除エラー:', error)
      alert('ユーザーの削除に失敗しました')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPasswordInput.trim()) {
      alert('新しいパスワードを入力してください')
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPasswordInput })
        .eq('id', resetPasswordUserId)

      if (error) throw error

      alert(`パスワードを更新しました: ${newPasswordInput}\n\nこのパスワードをユーザーに伝えてください。`)

      // ダイアログを閉じて状態をリセット
      setIsResetPasswordDialogOpen(false)
      setResetPasswordUserId(null)
      setNewPasswordInput("")

      // ユーザーリストを再取得
      fetchUsers()
    } catch (error) {
      console.error('パスワードのリセットエラー:', error)
      alert('パスワードのリセットに失敗しました')
    }
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setGeneratedPassword("")
          }
        }}>
          <DialogTrigger asChild>
            <Button>新しいユーザーを追加</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいユーザーを追加</DialogTitle>
              <DialogDescription>
                ユーザー情報を入力してください。パスワードはスタッフコードと同じになります。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff_code">スタッフコード</Label>
                <Input
                  id="staff_code"
                  type="text"
                  placeholder="例: 149"
                  value={newUser.staff_code}
                  onChange={(e) => setNewUser({ ...newUser, staff_code: e.target.value })}
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
                  <p className="text-sm text-green-800 mb-2">パスワード（スタッフコードと同じ）:</p>
                  <p className="text-lg font-mono font-bold text-green-900 bg-white p-2 rounded border border-green-300">
                    {generatedPassword}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    このパスワードをユーザーに伝えてください。
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
                <TableHead>スタッフコード</TableHead>
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
                  <TableCell>{u.staff_code}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {u.password_hash}
                    </code>
                  </TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString('ja-JP')}</TableCell>
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
                        onClick={() => {
                          setResetPasswordUserId(u.id)
                          setIsResetPasswordDialogOpen(true)
                        }}
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
              <Label htmlFor="edit-staff_code">スタッフコード</Label>
              <Input
                id="edit-staff_code"
                type="text"
                value={editingUser?.staff_code || ""}
                onChange={(e) => editingUser && setEditingUser({ ...editingUser, staff_code: e.target.value })}
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワードを再発行</DialogTitle>
            <DialogDescription>
              新しいパスワードを入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="text"
                placeholder="新しいパスワードを入力"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
              />
            </div>
            <Button onClick={handleResetPassword} className="w-full">パスワードを更新</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
