"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const navItems = [
  {
    title: "ダッシュボード",
    href: "/dashboard",
  },
  {
    title: "ユーザー管理",
    href: "/dashboard/users",
  },
  {
    title: "評価期間管理",
    href: "/dashboard/periods",
  },
  {
    title: "評価項目管理",
    href: "/dashboard/templates",
  },
  {
    title: "評価実施",
    href: "/dashboard/evaluations",
  },
  {
    title: "評価一覧",
    href: "/dashboard/results",
  },
  {
    title: "評価ランキング",
    href: "/dashboard/ranking",
    adminOnly: true,
  },
  {
    title: "📖 使い方ガイド",
    href: "/dashboard/guide",
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        // 管理者専用メニューは管理者のみ表示
        if (item.adminOnly && user?.role !== 'admin') {
          return null
        }

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href ? "default" : "ghost"}
              className="w-full justify-start"
            >
              {item.title}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
