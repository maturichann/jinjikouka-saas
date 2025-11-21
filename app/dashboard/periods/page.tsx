"use client"

import { useState, useEffect } from "react"
import { useAuth, canManagePeriods } from "@/contexts/auth-context"
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
import { Checkbox } from "@/components/ui/checkbox"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed'
  template_id?: string
}

type UserForAssignment = {
  id: string
  name: string
  email: string
  department: string
  role: string
}

export default function PeriodsPage() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<Period[]>([])
  const [templates, setTemplates] = useState<Array<{id: string, name: string}>>([])
  const [users, setUsers] = useState<UserForAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedPeriodForAssignment, setSelectedPeriodForAssignment] = useState<Period | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: "",
    template_id: ""
  })
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPeriods()
    fetchTemplates()
    fetchUsers()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_templates')
        .select('id, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('テンプレートの取得エラー:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, department, role')
        .order('name', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('ユーザーの取得エラー:', error)
    }
  }

  const fetchPeriods = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_periods')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPeriods(data || [])
    } catch (error) {
      console.error('評価期間の取得エラー:', error)
      alert('評価期間の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!user) return

    if (!newPeriod.template_id) {
      alert('評価テンプレートを選択してください')
      return
    }

    try {
      const { data, error} = await supabase
        .from('evaluation_periods')
        .insert([{
          name: newPeriod.name,
          start_date: newPeriod.start_date,
          end_date: newPeriod.end_date,
          template_id: newPeriod.template_id,
          status: 'draft',
          created_by: user.id
        }])
        .select()

      if (error) throw error

      setNewPeriod({ name: "", start_date: "", end_date: "", template_id: "" })
      setIsDialogOpen(false)
      fetchPeriods()
    } catch (error) {
      console.error('評価期間の作成エラー:', error)
      alert('評価期間の作成に失敗しました')
    }
  }

  const handleEdit = async () => {
    if (!editingPeriod) return

    try {
      const { error } = await supabase
        .from('evaluation_periods')
        .update({
          name: editingPeriod.name,
          start_date: editingPeriod.start_date,
          end_date: editingPeriod.end_date,
          status: editingPeriod.status
        })
        .eq('id', editingPeriod.id)

      if (error) throw error

      setEditingPeriod(null)
      setIsEditDialogOpen(false)
      fetchPeriods()
    } catch (error) {
      console.error('評価期間の更新エラー:', error)
      alert('評価期間の更新に失敗しました')
    }
  }

  const handleDelete = async (periodId: string) => {
    if (!confirm("この評価期間を削除してもよろしいですか？")) return

    try {
      const { error } = await supabase
        .from('evaluation_periods')
        .delete()
        .eq('id', periodId)

      if (error) throw error

      fetchPeriods()
    } catch (error) {
      console.error('評価期間の削除エラー:', error)
      alert('評価期間の削除に失敗しました')
    }
  }

  const handleStatusChange = async (periodId: string, newStatus: 'draft' | 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('evaluation_periods')
        .update({ status: newStatus })
        .eq('id', periodId)

      if (error) throw error

      fetchPeriods()
    } catch (error) {
      console.error('ステータスの更新エラー:', error)
      alert('ステータスの更新に失敗しました')
    }
  }

  const handleOpenAssignDialog = (period: Period) => {
    setSelectedPeriodForAssignment(period)
    setSelectedUserIds([])
    setIsAssignDialogOpen(true)
  }

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleToggleAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map(u => u.id))
    }
  }

  const handleAssignEvaluations = async () => {
    if (!selectedPeriodForAssignment || selectedUserIds.length === 0) {
      alert('ユーザーを選択してください')
      return
    }

    try {
      setIsAssigning(true)

      // 各ユーザーに対して3段階の評価を作成（self, manager, mg）
      const evaluationsToCreate = []

      for (const userId of selectedUserIds) {
        // 本人評価
        evaluationsToCreate.push({
          period_id: selectedPeriodForAssignment.id,
          evaluatee_id: userId,
          evaluator_id: userId,
          stage: 'self',
          status: 'pending'
        })

        // 店長評価（evaluator_idは後で設定）
        evaluationsToCreate.push({
          period_id: selectedPeriodForAssignment.id,
          evaluatee_id: userId,
          evaluator_id: null,
          stage: 'manager',
          status: 'pending'
        })

        // MG評価（evaluator_idは後で設定）
        evaluationsToCreate.push({
          period_id: selectedPeriodForAssignment.id,
          evaluatee_id: userId,
          evaluator_id: null,
          stage: 'mg',
          status: 'pending'
        })
      }

      const { error } = await supabase
        .from('evaluations')
        .insert(evaluationsToCreate)

      if (error) throw error

      alert(`${selectedUserIds.length}人のユーザーに評価を割り当てました`)
      setIsAssignDialogOpen(false)
      setSelectedPeriodForAssignment(null)
      setSelectedUserIds([])
    } catch (error: any) {
      console.error('評価の割り当てエラー:', error)
      if (error.code === '23505') {
        alert('一部のユーザーには既に評価が割り当てられています')
      } else {
        alert('評価の割り当てに失敗しました')
      }
    } finally {
      setIsAssigning(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      draft: { variant: "outline", label: "下書き" },
      active: { variant: "default", label: "実施中" },
      completed: { variant: "secondary", label: "完了" }
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const canManage = user ? canManagePeriods(user.role) : false

  if (!user) return null

  if (!canManage) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">評価期間管理</h1>
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
          <h1 className="text-3xl font-bold">評価期間管理</h1>
          <p className="text-gray-600 mt-2">評価期間の作成・編集・管理</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>新しい評価期間を作成</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しい評価期間を作成</DialogTitle>
              <DialogDescription>
                評価期間の名前と期間を設定してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">期間名</Label>
                <Input
                  id="name"
                  placeholder="例: 2024年度上期評価"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="start_date">開始日</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newPeriod.start_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">終了日</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newPeriod.end_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template">評価テンプレート</Label>
                <select
                  id="template"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newPeriod.template_id}
                  onChange={(e) => setNewPeriod({ ...newPeriod, template_id: e.target.value })}
                >
                  <option value="">テンプレートを選択</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreate} className="w-full">作成</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>評価期間一覧</CardTitle>
          <CardDescription>登録されている評価期間の一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>期間名</TableHead>
                <TableHead>開始日</TableHead>
                <TableHead>終了日</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.name}</TableCell>
                  <TableCell>{period.start_date}</TableCell>
                  <TableCell>{period.end_date}</TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenAssignDialog(period)}
                      >
                        評価を割り当て
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPeriod(period)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(period.id)}
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

      {/* Edit Period Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>評価期間を編集</DialogTitle>
            <DialogDescription>
              評価期間の名前と期間を編集してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">期間名</Label>
              <Input
                id="edit-name"
                placeholder="例: 2024年度上期評価"
                value={editingPeriod?.name || ""}
                onChange={(e) => editingPeriod && setEditingPeriod({ ...editingPeriod, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-start_date">開始日</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={editingPeriod?.start_date || ""}
                onChange={(e) => editingPeriod && setEditingPeriod({ ...editingPeriod, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-end_date">終了日</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={editingPeriod?.end_date || ""}
                onChange={(e) => editingPeriod && setEditingPeriod({ ...editingPeriod, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">ステータス</Label>
              <select
                id="edit-status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={editingPeriod?.status || "draft"}
                onChange={(e) => editingPeriod && setEditingPeriod({ ...editingPeriod, status: e.target.value as 'draft' | 'active' | 'completed' })}
              >
                <option value="draft">下書き</option>
                <option value="active">実施中</option>
                <option value="completed">完了</option>
              </select>
            </div>
            <Button onClick={handleEdit} className="w-full">更新</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Evaluations Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>評価を割り当て</DialogTitle>
            <DialogDescription>
              {selectedPeriodForAssignment?.name} にユーザーを割り当てて評価を作成します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedUserIds.length === users.length && users.length > 0}
                onCheckedChange={handleToggleAll}
              />
              <Label htmlFor="select-all" className="font-semibold">
                全員を選択 ({selectedUserIds.length}/{users.length})
              </Label>
            </div>

            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <div className="p-4 space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.department} - {user.role}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-1">割り当てられる評価:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>本人評価（self）- 各ユーザー自身が実施</li>
                <li>店長評価（manager）- 後で評価者を指定</li>
                <li>MG評価（mg）- 後で評価者を指定</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleAssignEvaluations}
                className="flex-1"
                disabled={isAssigning || selectedUserIds.length === 0}
              >
                {isAssigning ? '割り当て中...' : `${selectedUserIds.length}人に割り当て`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
                disabled={isAssigning}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
