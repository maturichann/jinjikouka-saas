"use client"

import { useState } from "react"
import { useAuth, canManagePeriods } from "@/contexts/auth-context"
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

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed'
}

export default function PeriodsPage() {
  const { user } = useAuth()
  const [periods, setPeriods] = useState<Period[]>([
    {
      id: "1",
      name: "2024年度上期評価",
      start_date: "2024-04-01",
      end_date: "2024-09-30",
      status: "active"
    }
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    start_date: "",
    end_date: ""
  })
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)

  const handleCreate = () => {
    const period: Period = {
      id: String(periods.length + 1),
      ...newPeriod,
      status: 'draft'
    }
    setPeriods([...periods, period])
    setNewPeriod({ name: "", start_date: "", end_date: "" })
    setIsDialogOpen(false)
  }

  const handleEdit = () => {
    if (!editingPeriod) return
    const updatedPeriods = periods.map(p =>
      p.id === editingPeriod.id ? editingPeriod : p
    )
    setPeriods(updatedPeriods)
    setEditingPeriod(null)
    setIsEditDialogOpen(false)
  }

  const handleDelete = (periodId: string) => {
    if (confirm("この評価期間を削除してもよろしいですか？")) {
      setPeriods(periods.filter(p => p.id !== periodId))
    }
  }

  const handleStatusChange = (periodId: string, newStatus: 'draft' | 'active' | 'completed') => {
    const updatedPeriods = periods.map(p =>
      p.id === periodId ? { ...p, status: newStatus } : p
    )
    setPeriods(updatedPeriods)
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
    </div>
  )
}
