"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"

type GradeKey = 'A' | 'B' | 'C' | 'D' | 'E'

type EvaluationItem = {
  id: string
  name: string
  description: string
  weight: number
  criteria: string
  category?: string
  subcategory?: string
  grade_scores?: { A: number; B: number; C: number; D: number; E: number }
  grade_criteria?: { A: string; B: string; C: string; D: string; E: string }
  hide_criteria_from_self?: boolean
  enabled_grades?: GradeKey[]
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
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    weight: 1,
    criteria: "",
    category: "",
    subcategory: "",
    grade_scores: { A: 5, B: 4, C: 3, D: 2, E: 1 },
    grade_criteria: { A: "", B: "", C: "", D: "", E: "" },
    hide_criteria_from_self: false,
    enabled_grades: ['A', 'B', 'C', 'D', 'E'] as GradeKey[]
  })
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }

  const fetchTemplates = useCallback(async () => {
    const supabase = supabaseRef.current
    if (!supabase) return

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
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreateTemplate = async () => {
    const supabase = supabaseRef.current
    if (!user || !supabase) return

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
    const supabase = supabaseRef.current
    if (!selectedTemplate || !supabase) return

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
          subcategory: newItem.subcategory || null,
          grade_scores: newItem.grade_scores,
          grade_criteria: newItem.grade_criteria,
          order_index: currentItemsCount,
          hide_criteria_from_self: newItem.hide_criteria_from_self,
          enabled_grades: newItem.enabled_grades
        }])
        .select()

      if (error) throw error

      setNewItem({
        name: "",
        description: "",
        weight: 1,
        criteria: "",
        category: "",
        subcategory: "",
        grade_scores: { A: 5, B: 4, C: 3, D: 2, E: 1 },
        grade_criteria: { A: "", B: "", C: "", D: "", E: "" },
        hide_criteria_from_self: false,
        enabled_grades: ['A', 'B', 'C', 'D', 'E'] as GradeKey[]
      })
      setIsItemDialogOpen(false)
      fetchTemplates()
    } catch (error) {
      console.error('評価項目の追加エラー:', error)
      alert('評価項目の追加に失敗しました')
    }
  }

  const handleEditTemplate = async () => {
    const supabase = supabaseRef.current
    if (!editingTemplate || !supabase) return

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
    const supabase = supabaseRef.current
    if (!editingItem || !selectedTemplate || !supabase) return

    try {
      const { error } = await supabase
        .from('evaluation_items')
        .update({
          name: editingItem.name,
          description: editingItem.description,
          weight: editingItem.weight,
          criteria: editingItem.criteria,
          category: editingItem.category || null,
          subcategory: editingItem.subcategory || null,
          grade_scores: editingItem.grade_scores,
          grade_criteria: editingItem.grade_criteria,
          hide_criteria_from_self: editingItem.hide_criteria_from_self,
          enabled_grades: editingItem.enabled_grades || ['A', 'B', 'C', 'D', 'E']
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
    const supabase = supabaseRef.current
    if (!confirm("このテンプレートを削除してもよろしいですか？\n\n※ このテンプレートに関連する評価項目、評価、評価スコアも全て削除されます。") || !supabase) return

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
    const supabase = supabaseRef.current
    if (!confirm("この評価項目を削除してもよろしいですか？") || !supabase) return

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
                <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                          {selectedTemplate && Array.from(new Set(selectedTemplate.items.map(i => i.category).filter(Boolean))).map(cat => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                        <p className="text-xs text-gray-500 mt-1">
                          既存のカテゴリーから選択するか、新しいカテゴリー名を入力
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="item-subcategory">サブカテゴリー</Label>
                        <Input
                          id="item-subcategory"
                          list="subcategories"
                          placeholder="例: 自主性、責任感、チームワーク"
                          value={newItem.subcategory}
                          onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })}
                        />
                        <datalist id="subcategories">
                          {selectedTemplate && Array.from(new Set(selectedTemplate.items.map(i => (i as any).subcategory).filter(Boolean))).map(sub => (
                            <option key={sub} value={sub} />
                          ))}
                        </datalist>
                        <p className="text-xs text-gray-500 mt-1">
                          行動評価などでサブカテゴリーが必要な場合に入力（任意）
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
                        <Label>使用するグレードを選択</Label>
                        <div className="flex gap-4 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => (
                            <label key={grade} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={newItem.enabled_grades.includes(grade)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewItem({
                                      ...newItem,
                                      enabled_grades: [...newItem.enabled_grades, grade].sort() as GradeKey[]
                                    })
                                  } else {
                                    if (newItem.enabled_grades.length > 1) {
                                      setNewItem({
                                        ...newItem,
                                        enabled_grades: newItem.enabled_grades.filter(g => g !== grade)
                                      })
                                    }
                                  }
                                }}
                              />
                              <span className="font-semibold">{grade}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newItem.enabled_grades.length}段階評価: {newItem.enabled_grades.join(', ')}
                        </p>
                      </div>
                      <div>
                        <Label>グレード別配点と評価基準</Label>
                        <div className="space-y-3 mt-2">
                          {(['A', 'B', 'C', 'D', 'E'] as const).map((grade, index) => {
                            const isEnabled = newItem.enabled_grades.includes(grade)
                            return (
                              <div key={grade} className={`p-3 border rounded-lg ${isEnabled ? 'bg-gray-50' : 'bg-gray-100 opacity-50'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <Label htmlFor={`grade-${grade.toLowerCase()}`} className="font-semibold min-w-[60px]">
                                    {grade}評価
                                  </Label>
                                  <Input
                                    id={`grade-${grade.toLowerCase()}`}
                                    type="number"
                                    step="0.5"
                                    placeholder={String(5 - index)}
                                    value={newItem.grade_scores?.[grade] || ""}
                                    onChange={(e) => setNewItem({
                                      ...newItem,
                                      grade_scores: { ...newItem.grade_scores!, [grade]: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-24"
                                    disabled={!isEnabled}
                                  />
                                  <span className="text-sm text-gray-600">点</span>
                                  {!isEnabled && <span className="text-xs text-gray-400">（無効）</span>}
                                </div>
                                <textarea
                                  placeholder={`${grade}評価の基準を入力（例: 期待を大きく上回る）`}
                                  value={newItem.grade_criteria?.[grade] || ""}
                                  onChange={(e) => setNewItem({
                                    ...newItem,
                                    grade_criteria: { ...newItem.grade_criteria!, [grade]: e.target.value }
                                  })}
                                  className="flex min-h-[60px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                  disabled={!isEnabled}
                                />
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          有効なグレードの点数と評価基準を設定してください
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <Checkbox
                          id="hide-criteria-self"
                          checked={newItem.hide_criteria_from_self}
                          onCheckedChange={(checked) => setNewItem({ ...newItem, hide_criteria_from_self: checked as boolean })}
                        />
                        <Label
                          htmlFor="hide-criteria-self"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          本人・店長評価時に評価基準を非表示にする
                        </Label>
                      </div>
                      <Button onClick={handleAddItem} className="w-full">追加</Button>
                    </div>
                  </DialogContent>
                </Dialog>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>カテゴリー</TableHead>
                    <TableHead>サブカテゴリー</TableHead>
                    <TableHead>項目名</TableHead>
                    <TableHead>説明</TableHead>
                    <TableHead>グレード配点</TableHead>
                    <TableHead>本人に非表示</TableHead>
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
                            <TableCell className="text-sm text-gray-600">{(item as any).subcategory || '-'}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {item.grade_scores ? (
                                  <div>
                                    <div className="font-semibold text-blue-600 mb-1">
                                      {(item.enabled_grades || ['A', 'B', 'C', 'D', 'E']).length}段階
                                    </div>
                                    {(item.enabled_grades || ['A', 'B', 'C', 'D', 'E']).map(g => (
                                      <span key={g}>{g}:{item.grade_scores![g as GradeKey]} </span>
                                    ))}
                                  </div>
                                ) : '未設定'}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.hide_criteria_from_self ? (
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">
                                  非表示
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
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
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        評価項目が登録されていません
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                  {selectedTemplate && Array.from(new Set(selectedTemplate.items.map(i => i.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  既存のカテゴリーから選択するか、新しいカテゴリー名を入力
                </p>
              </div>
              <div>
                <Label htmlFor="edit-item-subcategory">サブカテゴリー</Label>
                <Input
                  id="edit-item-subcategory"
                  list="edit-subcategories"
                  placeholder="例: 自主性、責任感、チームワーク"
                  value={editingItem?.subcategory || ""}
                  onChange={(e) => editingItem && setEditingItem({ ...editingItem, subcategory: e.target.value })}
                />
                <datalist id="edit-subcategories">
                  {selectedTemplate && Array.from(new Set(selectedTemplate.items.map(i => (i as any).subcategory).filter(Boolean))).map(sub => (
                    <option key={sub} value={sub} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  行動評価などでサブカテゴリーが必要な場合に入力（任意）
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
                <Label>使用するグレードを選択</Label>
                <div className="flex gap-4 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => {
                    const enabledGrades = editingItem?.enabled_grades || ['A', 'B', 'C', 'D', 'E']
                    return (
                      <label key={grade} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={enabledGrades.includes(grade)}
                          onCheckedChange={(checked) => {
                            if (!editingItem) return
                            if (checked) {
                              setEditingItem({
                                ...editingItem,
                                enabled_grades: [...enabledGrades, grade].sort() as GradeKey[]
                              })
                            } else {
                              if (enabledGrades.length > 1) {
                                setEditingItem({
                                  ...editingItem,
                                  enabled_grades: enabledGrades.filter(g => g !== grade)
                                })
                              }
                            }
                          }}
                        />
                        <span className="font-semibold">{grade}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(editingItem?.enabled_grades || ['A', 'B', 'C', 'D', 'E']).length}段階評価: {(editingItem?.enabled_grades || ['A', 'B', 'C', 'D', 'E']).join(', ')}
                </p>
              </div>
              <div>
                <Label>グレード別配点と評価基準</Label>
                <div className="space-y-3 mt-2">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((grade, index) => {
                    const enabledGrades = editingItem?.enabled_grades || ['A', 'B', 'C', 'D', 'E']
                    const isEnabled = enabledGrades.includes(grade)
                    return (
                      <div key={grade} className={`p-3 border rounded-lg ${isEnabled ? 'bg-gray-50' : 'bg-gray-100 opacity-50'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <Label htmlFor={`edit-grade-${grade.toLowerCase()}`} className="font-semibold min-w-[60px]">
                            {grade}評価
                          </Label>
                          <Input
                            id={`edit-grade-${grade.toLowerCase()}`}
                            type="number"
                            step="0.5"
                            placeholder={String(5 - index)}
                            value={editingItem?.grade_scores?.[grade] || ""}
                            onChange={(e) => editingItem && setEditingItem({
                              ...editingItem,
                              grade_scores: { ...editingItem.grade_scores!, [grade]: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-24"
                            disabled={!isEnabled}
                          />
                          <span className="text-sm text-gray-600">点</span>
                          {!isEnabled && <span className="text-xs text-gray-400">（無効）</span>}
                        </div>
                        <textarea
                          placeholder={`${grade}評価の基準を入力（例: 期待を大きく上回る）`}
                          value={editingItem?.grade_criteria?.[grade] || ""}
                          onChange={(e) => editingItem && setEditingItem({
                            ...editingItem,
                            grade_criteria: { ...editingItem.grade_criteria!, [grade]: e.target.value }
                          })}
                          className="flex min-h-[60px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                          disabled={!isEnabled}
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  有効なグレードの点数と評価基準を設定してください
                </p>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <Checkbox
                  id="edit-hide-criteria-self"
                  checked={editingItem?.hide_criteria_from_self || false}
                  onCheckedChange={(checked) => editingItem && setEditingItem({ ...editingItem, hide_criteria_from_self: checked as boolean })}
                />
                <Label
                  htmlFor="edit-hide-criteria-self"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  本人・店長評価時に評価基準を非表示にする
                </Label>
              </div>
              <Button onClick={handleEditItem} className="w-full">更新</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
