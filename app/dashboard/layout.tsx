"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/nav"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  const handleChangePassword = async () => {
    if (!user || !supabaseRef.current) return

    if (!newPassword.trim()) {
      alert('新しいパスワードを入力してください')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('パスワードが一致しません')
      return
    }

    try {
      setIsChangingPassword(true)

      const { error } = await supabaseRef.current
        .from('users')
        .update({ password_hash: newPassword })
        .eq('id', user.id)

      if (error) throw error

      alert('パスワードを変更しました')
      setIsPasswordDialogOpen(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error('パスワード変更エラー:', error)
      alert('パスワードの変更に失敗しました')
    } finally {
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      admin: { variant: "default", label: "管理者" },
      mg: { variant: "default", label: "MG" },
      manager: { variant: "secondary", label: "店長" },
      staff: { variant: "outline", label: "スタッフ" }
    }
    const config = variants[role] || variants.staff
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <aside className="w-64 border-r bg-gray-50 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">人事考課SAAS</h1>
          <p className="text-sm text-gray-600 mt-1">管理画面</p>
        </div>

        <div className="flex-1">
          <DashboardNav />
        </div>

        {/* 操作ガイド */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">📖 使い方</h3>
          <div className="text-xs text-blue-800 space-y-2">
            <div>
              <p className="font-medium">1. テンプレート作成</p>
              <p className="text-blue-700">評価項目と配点を設定</p>
            </div>
            <div>
              <p className="font-medium">2. ユーザー追加</p>
              <p className="text-blue-700">評価対象者を登録</p>
            </div>
            <div>
              <p className="font-medium">3. 評価期間作成</p>
              <p className="text-blue-700">期間とテンプレートを選択</p>
            </div>
            <div>
              <p className="font-medium">4. 評価を割り当て</p>
              <p className="text-blue-700">対象者にチェックして割り当て</p>
            </div>
            <div>
              <p className="font-medium">5. 評価実施</p>
              <p className="text-blue-700">本人→店長→MGの順で評価</p>
            </div>
          </div>
        </div>

        {/* ユーザー情報とログアウト */}
        <div className="mt-6 pt-6 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600">ID: {user.staff_code}</p>
            <p className="text-xs text-gray-600">{user.department}</p>
            <div className="mt-2">
              {getRoleBadge(user.role)}
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setIsPasswordDialogOpen(true)}>
              パスワード変更
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* パスワード変更ダイアログ */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>パスワード変更</DialogTitle>
            <DialogDescription>
              新しいパスワードを入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="新しいパスワード"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">パスワード確認</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              className="w-full"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '変更中...' : 'パスワードを変更'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* メインコンテンツ */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
