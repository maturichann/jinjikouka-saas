"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UserRole = 'admin' | 'mg' | 'manager' | 'staff'

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // ローカルストレージから認証情報を復元
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user', error)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Supabaseからユーザーを検索
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, department, password_hash')
        .eq('email', email)
        .single()

      if (error || !data) {
        console.error('ユーザーが見つかりません:', error)
        return false
      }

      // パスワードチェック（本番環境ではハッシュ化すべき）
      if (data.password_hash !== password) {
        console.error('パスワードが一致しません')
        return false
      }

      // 認証成功
      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        department: data.department
      }

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('ログインエラー:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 権限チェックヘルパー

// 全ての評価を閲覧できるか（MG・管理者）
export function canViewAllEvaluations(role: UserRole): boolean {
  return role === 'admin' || role === 'mg'
}

// 部署の評価を閲覧できるか（店長・MG・管理者）
export function canViewDepartmentEvaluations(role: UserRole): boolean {
  return role === 'admin' || role === 'mg' || role === 'manager'
}

// 評価項目やテンプレートを編集できるか（管理者のみ）
export function canManageTemplates(role: UserRole): boolean {
  return role === 'admin'
}

// 評価期間を管理できるか（管理者のみ）
export function canManagePeriods(role: UserRole): boolean {
  return role === 'admin'
}

// ユーザー管理ができるか（管理者のみ）
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

// 他人を評価できるか（店長・MG・管理者）
export function canEvaluateOthers(role: UserRole): boolean {
  return role === 'admin' || role === 'mg' || role === 'manager'
}
