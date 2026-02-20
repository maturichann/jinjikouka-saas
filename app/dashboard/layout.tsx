"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  // ページ遷移時にモバイルメニューを閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

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
      mg: { variant: "default", label: "MG評価者" },
      manager: { variant: "secondary", label: "店長評価者" },
      staff: { variant: "outline", label: "スタッフ" }
    }
    const config = variants[role] || variants.staff
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const sidebarContent = (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">人事考課SAAS</h1>
        <p className="text-sm text-gray-600 mt-1">管理画面</p>
      </div>

      <div className="flex-1">
        <DashboardNav />
      </div>

      {/* 操作ガイド（モバイルでは非表示） */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 hidden md:block">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">使い方</h3>
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
          <Button variant="outline" size="sm" className="w-full" onClick={() => { setIsPasswordDialogOpen(true); setIsMobileMenuOpen(false) }}>
            パスワード変更
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* モバイルヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            aria-label="メニュー"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <h1 className="text-base font-bold text-gray-900">人事考課SAAS</h1>
          <div className="flex items-center gap-1">
            {getRoleBadge(user.role)}
          </div>
        </div>
      </div>

      {/* モバイルオーバーレイ */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* サイドバー: PC=固定表示、モバイル=オーバーレイ */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-gray-50 border-r p-6 flex flex-col z-50
        transition-transform duration-200 ease-in-out
        md:sticky md:top-0 md:w-64 md:translate-x-0 md:transition-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
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
      <main className="flex-1 min-w-0 pt-14 md:pt-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
