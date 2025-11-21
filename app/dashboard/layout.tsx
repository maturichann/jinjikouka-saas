"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/nav"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

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

        {/* ユーザー情報とログアウト */}
        <div className="mt-auto pt-6 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
            <p className="text-xs text-gray-600">{user.department}</p>
            <div className="mt-2">
              {getRoleBadge(user.role)}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
