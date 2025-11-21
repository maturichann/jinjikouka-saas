"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'admin' | 'mg' | 'manager' | 'staff'

export type User = {
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

// ダミーユーザーデータベース（実際はSupabaseを使用）
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@example.com': {
    password: 'admin123',
    user: {
      email: 'admin@example.com',
      name: '管理者太郎',
      role: 'admin',
      department: '本社'
    }
  },
  'mg@example.com': {
    password: 'mg123',
    user: {
      email: 'mg@example.com',
      name: 'MG花子',
      role: 'mg',
      department: '本社'
    }
  },
  'manager@example.com': {
    password: 'manager123',
    user: {
      email: 'manager@example.com',
      name: '店長太郎',
      role: 'manager',
      department: '渋谷店'
    }
  },
  'staff@example.com': {
    password: 'staff123',
    user: {
      email: 'staff@example.com',
      name: '山田花子',
      role: 'staff',
      department: '渋谷店'
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    const userRecord = DEMO_USERS[email]

    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user)
      localStorage.setItem('user', JSON.stringify(userRecord.user))
      return true
    }

    return false
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
