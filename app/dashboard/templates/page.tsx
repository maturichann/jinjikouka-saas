"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, canManageTemplates } from "@/contexts/auth-context"
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

type EvaluationItem = {
  id: string
  name: string
  description: string
  weight: number
  criteria: string
  category?: string
}

type Template = {
  id: string
  name: string
  description: string
  items: EvaluationItem[]
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isEditTemplateDialogOpen, setIsEditTemplateDialogOpen] = useState(false)
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "" })
  const [newItem, setNewItem] = useState({ name: "", description: "", weight: 0, criteria: "", category: "" })
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null)
  const supabase = createClient()

  const fetchTemplates = useCallback(async () => {
    try {
      // テンプレート取得
      const { data: templatesData, error: templatesError } = await supabase
        .from('evaluation_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      // 各テンプレートの項目を取得
      const templatesWithItems = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('evaluation_items')
            .select('*')
            .eq('template_id', template.id)
            .order('order_index', { ascending: true })

          if (itemsError) throw itemsError

          return {
            ...template,
            items: itemsData || []
          }
        })
      )

      setTemplates(templatesWithItems)
    } catch (error) {
      console.error('テンプレートの取得エラー:', error)
      alert('テンプレートの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreateTemplate = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('evaluation_templates')
        .insert([{
          name: newTemplate.name,
          description: newTemplate.description
        }])
        .select()

      if (error) throw error

      setNewTemplate({ name: "", description: "" })
      setIsDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('テンプレートの作成エラー:', error)
      alert('テンプレートの作成に失敗しました')
    }
  }

  const handleAddItem = async () => {
    if (!selectedTemplate) return

    try {
      // 現在の項目数を取得してorder_indexを設定
      const currentItemsCount = selectedTemplate.items.length

      const { data, error } = await supabase
        .from('evaluation_items')
        .insert([{
          template_id: selectedTemplate.id,
          name: newItem.name,
          description: newItem.description,
          weight: newItem.weight,
          criteria: newItem.criteria,
          category: newItem.category || null,
          order_index: currentItemsCount
        }])
        .select()

      if (error) throw error

      setNewItem({ name: "", description: "", weight: 0, criteria: "", category: "" })
      setIsItemDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('評価項目の追加エラー:', error)
      alert('評価項目の追加に失敗しました')
    }
  }

  const handleEditTemplate = async () => {
    if (!editingTemplate) return

    try {
      const { error } = await supabase
        .from('evaluation_templates')
        .update({
          name: editingTemplate.name,
          description: editingTemplate.description
        })
        .eq('id', editingTemplate.id)

      if (error) throw error

      setEditingTemplate(null)
      setIsEditTemplateDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('テンプレートの更新エラー:', error)
      alert('テンプレートの更新に失敗しました')
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !selectedTemplate) return

    try {
      const { error } = await supabase
        .from('evaluation_items')
        .update({
          name: editingItem.name,
          description: editingItem.description,
          weight: editingItem.weight,
          criteria: editingItem.criteria,
          category: editingItem.category || null
        })
        .eq('id', editingItem.id)

      if (error) throw error

      setEditingItem(null)
      setIsEditItemDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('評価項目の更新エラー:', error)
      alert('評価項目の更新に失敗しました')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("このテンプレートを削除してもよろしいですか？\n\n※ このテンプレートに関連する評価項目、評価、評価スコアも全て削除されます。")) return

    try {
      // 1. このテンプレートの評価項目IDを取得
      const { data: items, error: itemsError } = await supabase
        .from('evaluation_items')
        .select('id')
        .eq('template_id', templateId)

      if (itemsError) throw itemsError

      const itemIds = (items || []).map(item => item.id)

      if (itemIds.length > 0) {
        // 2. 評価項目に関連する評価スコアを削除
        const { error: scoresError } = await supabase
          .from('evaluation_scores')
          .delete()
          .in('item_id', itemIds)

        if (scoresError) throw scoresError

        // 3. 評価項目を削除
        const { error: deleteItemsError } = await supabase
          .from('evaluation_items')
          .delete()
          .eq('template_id', templateId)

        if (deleteItemsError) throw deleteItemsError
      }

      // 4. このテンプレートを使用している評価期間があれば削除
      const { data: periods, error: periodsError } = await supabase
        .from('evaluation_periods')
        .select('id')
        .eq('template_id', templateId)

      if (periodsError) throw periodsError

      const periodIds = (periods || []).map(p => p.id)

      if (periodIds.length > 0) {
        // 5. 評価期間に関連する評価を削除
        const { error: deleteEvalsError } = await supabase
          .from('evaluations')
          .delete()
          .in('period_id', periodIds)

        if (deleteEvalsError) throw deleteEvalsError

        // 6. 評価期間を削除
        const { error: deletePeriodsError } = await supabase
          .from('evaluation_periods')
          .delete()
          .eq('template_id', templateId)

        if (deletePeriodsError) throw deletePeriodsError
      }

      // 7. 最後にテンプレートを削除
      const { error } = await supabase
        .from('evaluation_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      alert('テンプレートと関連データを削除しました')
      fetchTemplates()
    } catch (error) {
      console.error('テンプレートの削除エラー:', error)
      alert('テンプレートの削除に失敗しました: ' + (error as Error).message)
    }
  }

  const handleDeleteItem = async (templateId: string, itemId: string) => {
    if (!confirm("この評価項目を削除してもよろしいですか？")) return

    try {
      const { error } = await supabase
        .from('evaluation_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      fetchTemplates()
    } catch (error) {
      console.error('評価項目の削除エラー:', error)
      alert('評価項目の削除に失敗しました')
    }
  }

  const canManage = user ? canManageTemplates(user.role) : false

  if (!user) return null

  if (!canManage) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">評価項目管理</h1>
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
          <h1 className="text-3xl font-bold">評価項目管理</h1>
          <p className="text-gray-600 mt-2">評価テンプレートと項目の設定</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>新しいテンプレートを作成</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいテンプレートを作成</DialogTitle>
              <DialogDescription>
                評価テンプレートの名前と説明を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">テンプレート名</Label>
                <Input
                  id="template-name"
                  placeholder="例: 一般社員用評価テンプレート"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="template-description">説明</Label>
                <Input
                  id="template-description"
                  placeholder="テンプレートの説明"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateTemplate} className="w-full">作成</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template)
                      setIsEditTemplateDialogOpen(true)
                    }}
                  >
                    テンプレート編集
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    削除
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setIsItemDialogOpen(true)
                    }}
                  >
                    項目を追加
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Dialog open={isItemDialogOpen && selectedTemplate?.id === template.id}
                      onOpenChange={(open) => {
                        setIsItemDialogOpen(open)
                        if (open) setSelectedTemplate(template)
                      }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>評価項目を追加</DialogTitle>
                    <DialogDescription>
                        評価項目の詳細を入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-category">大項目（カテゴリー）</Label>
                        <Input
                          id="item-category"
                          list="categories"
                          placeholder="例: 行動評価、業績評価"
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        />
                        <datalist id="categories">
                          {Array.from(new Set(templates.flatMap(t => t.items.map(i => i.category).filter(Boolean)))).map(cat => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                        <p className="text-xs text-gray-500 mt-1">
                          既存のカテゴリーから選択するか、新しいカテゴリー名を入力
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="item-name">項目名</Label>
                        <Input
                          id="item-name"
                          placeholder="例: 業務遂行能力"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-description">説明</Label>
                        <Input
                          id="item-description"
                          placeholder="評価項目の説明"
                          value={newItem.description}
                          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-weight">配点（重み）</Label>
                        <Input
                          id="item-weight"
                          type="number"
                          placeholder="30"
                          value={newItem.weight || ""}
                          onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          この項目の重要度（総合スコア計算時の重み）。例: 30
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="item-criteria">採点基準</Label>
                        <textarea
                          id="item-criteria"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="5.0: 期待を大きく上回る&#10;4.0: 期待を上回る&#10;3.0: 期待通り&#10;2.0: やや不足&#10;1.0: 大幅に不足"
                          value={newItem.criteria}
                          onChange={(e) => setNewItem({ ...newItem, criteria: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          各評価レベル（1.0〜5.0）の基準を記載してください
                        </p>
                      </div>
                      <Button onClick={handleAddItem} className="w-full">追加</Button>
                    </div>
                  </DialogContent>
                </Dialog>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリー</TableHead>
                    <TableHead>項目名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>配点</TableHead>
                    <TableHead>採点基準</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // カテゴリーでグループ化
                    const grouped = template.items.reduce((acc: Record<string, typeof template.items>, item) => {
                      const category = item.category || "未分類"
                      if (!acc[category]) acc[category] = []
                      acc[category].push(item)
                      return acc
                    }, {})

                    return Object.entries(grouped).map(([category, items], catIdx) => (
                      <>
                        {items.map((item, itemIdx) => (
                          <TableRow key={item.id} className={itemIdx === 0 ? "border-t-2 border-blue-200" : ""}>
                            {itemIdx === 0 && (
                              <TableCell rowSpan={items.length} className="font-bold bg-blue-50 text-blue-900 align-top">
                                {category}
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.weight}点</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-xs whitespace-pre-line text-gray-600">
                                {item.criteria || "未設定"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item)
                                    setSelectedTemplate(template)
                                    setIsEditItemDialogOpen(true)
                                  }}
                                >
                                  編集
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteItem(template.id, item.id)}
                                >
                                  削除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ))
                  })()}
                  {template.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        評価項目が登録されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {template.items.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    合計配点: {template.items.reduce((sum, item) => sum + item.weight, 0)}点
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Edit Template Dialog */}
        <Dialog open={isEditTemplateDialogOpen} onOpenChange={setIsEditTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>テンプレートを編集</DialogTitle>
              <DialogDescription>
                テンプレートの名前と説明を編集してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-template-name">テンプレート名</Label>
                <Input
                  id="edit-template-name"
                  placeholder="例: 一般社員用評価テンプレート"
                  value={editingTemplate?.name || ""}
                  onChange={(e) => editingTemplate && setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-template-description">説明</Label>
                <Input
                  id="edit-template-description"
                  placeholder="テンプレートの説明"
                  value={editingTemplate?.description || ""}
                  onChange={(e) => editingTemplate && setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <Button onClick={handleEditTemplate} className="w-full">更新</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>評価項目を編集</DialogTitle>
              <DialogDescription>
                評価項目の詳細を編集してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-item-category">大項目（カテゴリー）</Label>
                <Input
                  id="edit-item-category"
                  list="edit-categories"
                  placeholder="例: 行動評価、業績評価"
                  value={editingItem?.category || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, category: e.target.value })}
                />
                <datalist id="edit-categories">
                  {Array.from(new Set(templates.flatMap(t => t.items.map(i => i.category).filter(Boolean)))).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  既存のカテゴリーから選択するか、新しいカテゴリー名を入力
                </p>
              </div>
              <div>
                <Label htmlFor="edit-item-name">項目名</Label>
                <Input
                  id="edit-item-name"
                  placeholder="例: 業務遂行能力"
                  value={editingItem?.name || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-item-description">説明</Label>
                <Input
                  id="edit-item-description"
                  placeholder="評価項目の説明"
                  value={editingItem?.description || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-item-weight">配点</Label>
                <Input
                  id="edit-item-weight"
                  type="number"
                  placeholder="30"
                  value={editingItem?.weight || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, weight: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-item-criteria">採点基準</Label>
                <textarea
                  id="edit-item-criteria"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="5.0: 期待を大きく上回る&#10;4.0: 期待を上回る&#10;3.0: 期待通り&#10;2.0: やや不足&#10;1.0: 大幅に不足"
                  value={editingItem?.criteria || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, criteria: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  各評価レベル（1.0〜5.0）の基準を記載してください
                </p>
              </div>
              <Button onClick={handleEditItem} className="w-full">更新</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
