import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// 日本語フォントを設定
function setupJapaneseFont(doc: jsPDF) {
  try {
    // jspdf-fontパッケージを動的にインポート
    require('jspdf-font')
    doc.addFont('GenShinGothic-Regular.ttf', 'GenShinGothic', 'normal')
    doc.setFont('GenShinGothic')
  } catch (error) {
    console.warn('日本語フォントの読み込みに失敗しました。デフォルトフォントを使用します。', error)
    // フォント読み込みに失敗してもPDF生成は継続
  }
}

export type EvaluationPDFData = {
  evaluatee: string
  department: string
  period: string
  evaluations: {
    stage: string
    status: string
    totalScore: number
    submittedAt: string
    items?: {
      name: string
      description: string
      weight: number
      score: number
      comment: string
      criteria?: string
    }[]
  }[]
}

export function generateEvaluationPDF(data: EvaluationPDFData) {
  const doc = new jsPDF()

  // 日本語フォントを設定
  setupJapaneseFont(doc)

  // タイトル
  doc.setFontSize(20)
  doc.text('評価レポート', 14, 22)
  doc.setFontSize(12)

  // 基本情報
  doc.text(`評価対象者: ${data.evaluatee}`, 14, 35)
  doc.text(`部署: ${data.department}`, 14, 42)
  doc.text(`評価期間: ${data.period}`, 14, 49)

  let yPos = 60

  // 各評価段階
  data.evaluations.forEach((evaluation, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // 評価段階のヘッダー
    doc.setFontSize(14)
    doc.setFillColor(59, 130, 246)
    doc.rect(14, yPos - 5, 182, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(`${evaluation.stage} - スコア: ${evaluation.totalScore.toFixed(1)}`, 16, yPos + 2)
    doc.setTextColor(0, 0, 0)

    yPos += 12

    doc.setFontSize(10)
    doc.text(`ステータス: ${evaluation.status} | 提出日: ${evaluation.submittedAt}`, 14, yPos)
    yPos += 10

    // 評価項目がある場合
    if (evaluation.items && evaluation.items.length > 0) {
      const tableData = evaluation.items.map(item => [
        item.name,
        item.weight.toString(),
        item.score.toFixed(1),
        (item.score * item.weight).toFixed(1),
        item.comment || '-'
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['項目', 'ウェイト', 'スコア', '加重', 'コメント']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], font: 'GenShinGothic' },
        styles: { fontSize: 9, cellPadding: 3, font: 'GenShinGothic' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 75 }
        }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    } else {
      yPos += 5
    }
  })

  // 総合評価サマリー
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.text('サマリー', 14, yPos)
  yPos += 10

  const summaryData = data.evaluations.map(e => [
    e.stage,
    e.totalScore.toFixed(1),
    e.status,
    e.submittedAt
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['評価段階', '総合スコア', 'ステータス', '提出日']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], font: 'GenShinGothic' },
    styles: { fontSize: 10, font: 'GenShinGothic' }
  })

  // ページ番号
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
  }

  // ファイル名を生成
  const fileName = `evaluation_${data.evaluatee.replace(/\s+/g, '_')}_${Date.now()}.pdf`

  // PDFをダウンロード
  doc.save(fileName)
}

export function generateMultipleEvaluationsPDF(evaluationsData: EvaluationPDFData[]) {
  const doc = new jsPDF()

  // 日本語フォントを設定
  setupJapaneseFont(doc)

  doc.setFontSize(18)
  doc.text('評価レポート - 複数対象者', 14, 22)

  let startY = 35

  evaluationsData.forEach((data, index) => {
    if (index > 0) {
      doc.addPage()
      startY = 20
    }

    doc.setFontSize(14)
    doc.text(`${index + 1}. ${data.evaluatee}`, 14, startY)
    startY += 8

    doc.setFontSize(10)
    doc.text(`部署: ${data.department} | 評価期間: ${data.period}`, 14, startY)
    startY += 10

    const summaryData = data.evaluations.map(e => [
      e.stage,
      e.totalScore.toFixed(1),
      e.status
    ])

    autoTable(doc, {
      startY: startY,
      head: [['評価段階', '総合スコア', 'ステータス']],
      body: summaryData,
      theme: 'grid',
      headStyles: { font: 'GenShinGothic' },
      styles: { fontSize: 9, font: 'GenShinGothic' }
    })

    startY = (doc as any).lastAutoTable.finalY + 15
  })

  const fileName = `evaluations_report_${Date.now()}.pdf`
  doc.save(fileName)
}
