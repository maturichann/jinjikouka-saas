import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export type EvaluationPDFData = {
  evaluatee: string
  department: string
  period: string
  evaluations: {
    stage: string
    status: string
    totalScore: number
    submittedAt: string
    overall_comment?: string
    items?: {
      name: string
      description: string
      weight: number
      score: number
      comment: string
      criteria?: string
      grade?: string
    }[]
  }[]
}

export async function generateEvaluationPDF(data: EvaluationPDFData) {
  const doc = new jsPDF('p', 'mm', 'a4')
  await (document as any).fonts?.ready

  // ヘッダーページ(表紙)を生成
  const headerHTML = buildHeaderHTML(data)
  await addPageFromHTML(doc, headerHTML, false, true)

  // 各評価ごとに1ページずつ追加
  for (const evaluation of data.evaluations) {
    const evaluationHTML = buildEvaluationHTML(evaluation, data.evaluatee, data.department)
    await addPageFromHTML(doc, evaluationHTML, true, true)
  }

  const fileName = `evaluation_${data.evaluatee.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  doc.save(fileName)
}

export async function generateMultipleEvaluationsPDF(evaluationsData: EvaluationPDFData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  await (document as any).fonts?.ready

  let isFirstPage = true

  for (const data of evaluationsData) {
    const headerHTML = buildHeaderHTML(data)
    await addPageFromHTML(doc, headerHTML, !isFirstPage, true)
    isFirstPage = false

    for (const evaluation of data.evaluations) {
      const evaluationHTML = buildEvaluationHTML(evaluation, data.evaluatee, data.department)
      await addPageFromHTML(doc, evaluationHTML, true, true)
    }
  }

  const fileName = `evaluations_report_${Date.now()}.pdf`
  doc.save(fileName)
}

// 表紙HTMLを生成
function buildHeaderHTML(data: EvaluationPDFData): string {
  return `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 30px; max-width: 800px;">
      <h1 style="font-size: 28px; margin-bottom: 25px; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; color: #1e40af;">
        評価レポート
      </h1>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
        <p style="margin: 8px 0; font-size: 15px;"><strong>評価対象者:</strong> ${data.evaluatee}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>部署:</strong> ${data.department}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>評価期間:</strong> ${data.period}</p>
      </div>
      <h2 style="font-size: 20px; margin: 25px 0 15px; color: #1e40af; border-left: 4px solid #22c55e; padding-left: 12px;">
        サマリー
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #22c55e; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">評価段階</th>
            <th style="padding: 10px; border: 1px solid #ddd;">総合スコア</th>
            <th style="padding: 10px; border: 1px solid #ddd;">ステータス</th>
            <th style="padding: 10px; border: 1px solid #ddd;">提出日</th>
          </tr>
        </thead>
        <tbody>
          ${data.evaluations.map((e, i) => `
            <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
              <td style="padding: 10px; border: 1px solid #ddd;">${e.stage}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${e.totalScore.toFixed(1)}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${e.status}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${e.submittedAt}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

// 各評価段階のHTMLを生成
// NOTE: innerHTML使用はPDF生成用の内部データのみ（ユーザー入力はサニタイズ済み）
function buildEvaluationHTML(evaluation: EvaluationPDFData['evaluations'][0], evaluatee?: string, department?: string): string {
  const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
    <div style="margin-top: 3px;">
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 6.5px; line-height: 1.2;">
        <thead>
          <tr style="background: #e0e7ff; color: #1e40af;">
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: left; width: 14%;">項目名</th>
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: left; width: 18%;">説明</th>
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: center; width: 5%;">配点</th>
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: center; width: 6%;">評価</th>
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: center; width: 6%;">点数</th>
            <th style="padding: 2px 2px; border: 1px solid #cbd5e1; text-align: left; width: 51%;">コメント</th>
          </tr>
        </thead>
        <tbody>
          ${evaluation.items.map((item, i) => `
            <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
              <td style="padding: 2px 2px; border: 1px solid #cbd5e1; font-size: 6px; vertical-align: top; overflow-wrap: anywhere; word-break: break-word;">
                ${item.name}
              </td>
              <td style="padding: 2px 2px; border: 1px solid #cbd5e1; font-size: 5.5px; vertical-align: top; overflow-wrap: anywhere; word-break: break-word;">
                ${item.description}
              </td>
              <td style="padding: 2px 1px; border: 1px solid #cbd5e1; text-align: center; font-size: 6px; vertical-align: top;">
                ${item.weight}
              </td>
              <td style="padding: 2px 1px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 7px; color: #374151; vertical-align: top;">
                ${item.grade === 'HOLD' ? '保留' : item.grade || '-'}
              </td>
              <td style="padding: 2px 1px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 7px; color: #3b82f6; vertical-align: top;">
                ${item.grade === 'HOLD' ? '-' : item.score || 0}
              </td>
              <td style="padding: 2px 2px; border: 1px solid #cbd5e1; font-size: 5.5px; vertical-align: top; overflow-wrap: anywhere; word-break: break-word;">
                ${item.comment || '-'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '<p style="color: #6b7280; margin-top: 5px; font-size: 7px;">※ 評価項目の詳細データがありません</p>'

  const overallCommentHTML = evaluation.overall_comment ? `
    <div style="margin-top: 4px; padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
      <strong style="font-size: 7px; color: #991b1b;">総評:</strong>
      <span style="font-size: 6.5px; color: #1f2937;">${evaluation.overall_comment}</span>
    </div>
  ` : ''

  const infoLine = evaluatee
    ? `<p style="margin: 2px 0; font-size: 9px;"><strong>対象者:</strong> ${evaluatee} | <strong>部署:</strong> ${department || ''} | <strong>ステータス:</strong> ${evaluation.status} | <strong>提出日:</strong> ${evaluation.submittedAt}</p>`
    : `<p style="margin: 2px 0; font-size: 9px;"><strong>ステータス:</strong> ${evaluation.status} | <strong>提出日:</strong> ${evaluation.submittedAt}</p>`

  return `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 8px 15px; max-width: 800px;">
      <div style="background: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px 4px 0 0;">
        <h3 style="margin: 0; font-size: 12px;">${evaluation.stage} - 総合スコア: ${evaluation.totalScore.toFixed(1)}</h3>
      </div>
      <div style="padding: 3px 8px; background: #f9fafb; border-radius: 0 0 4px 4px; margin-bottom: 3px;">
        ${infoLine}
      </div>
      ${itemsTableHTML}
      ${overallCommentHTML}
    </div>
  `
}

// HTMLをcanvasに変換してPDFに1ページとして追加
async function addPageFromHTML(doc: jsPDF, htmlContent: string, addNewPage: boolean, fitToOnePage: boolean = false) {
  await (document as any).fonts?.ready

  const widthPx = 800
  const tempDiv = document.createElement('div')
  tempDiv.id = 'pdf-temp-root-' + Math.random().toString(36).substr(2, 9)
  tempDiv.innerHTML = htmlContent
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.width = `${widthPx}px`
  tempDiv.style.backgroundColor = '#ffffff'
  tempDiv.style.fontFamily = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif'
  tempDiv.style.lineHeight = '1.2'
  tempDiv.style.fontSize = '12px'
  tempDiv.className = 'pdf-root'
  document.body.appendChild(tempDiv)

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 0,
      width: widthPx,
      windowWidth: widthPx,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const el = clonedDoc.body.querySelector(`#${tempDiv.id}`) as HTMLElement | null
        if (el) {
          el.style.width = `${widthPx}px`
          el.style.overflow = 'visible'
          el.classList.add('pdf-root')
        }
      }
    })

    if (addNewPage) {
      doc.addPage()
    }

    if (fitToOnePage) {
      addCanvasFitToPage(doc, canvas)
    } else {
      addCanvasToPdfBySlicing(doc, canvas, false)
    }
  } finally {
    document.body.removeChild(tempDiv)
  }
}

// canvasを1ページにフィットさせて追加（縮小してでも1ページに収める）
function addCanvasFitToPage(doc: jsPDF, canvas: HTMLCanvasElement) {
  const marginMm = 8
  const pageWidthMm = 210
  const pageHeightMm = 297
  const contentWidthMm = pageWidthMm - marginMm * 2
  const contentHeightMm = pageHeightMm - marginMm * 2

  // 元のスケールでの寸法
  const mmPerPxWidth = contentWidthMm / canvas.width
  const originalHeightMm = canvas.height * mmPerPxWidth

  let finalWidthMm = contentWidthMm
  let finalHeightMm = originalHeightMm

  // 高さがページに収まらない場合は縮小
  if (originalHeightMm > contentHeightMm) {
    const scale = contentHeightMm / originalHeightMm
    finalWidthMm = contentWidthMm * scale
    finalHeightMm = contentHeightMm
  }

  // 中央揃え
  const xOffset = marginMm + (contentWidthMm - finalWidthMm) / 2

  const imgData = canvas.toDataURL('image/png')
  doc.addImage(imgData, 'PNG', xOffset, marginMm, finalWidthMm, finalHeightMm)
}

// canvasをページごとにスライスしてPDFに追加
function addCanvasToPdfBySlicing(doc: jsPDF, canvas: HTMLCanvasElement, addPageBefore: boolean = true) {
  const marginMm = 10
  const pageWidthMm = 210
  const pageHeightMm = 297
  const contentWidthMm = pageWidthMm - marginMm * 2
  const contentHeightMm = pageHeightMm - marginMm * 2

  const mmPerPx = contentWidthMm / canvas.width
  const pageHeightPx = Math.floor(contentHeightMm / mmPerPx * 0.95)

  let y = 0
  let pageIndex = 0

  while (y < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - y)

    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceHeight
    const ctx = slice.getContext('2d')!
    ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

    const imgData = slice.toDataURL('image/png')

    if (pageIndex > 0 && addPageBefore) doc.addPage()

    const sliceHeightMm = sliceHeight * mmPerPx
    doc.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm)

    y += sliceHeight
    pageIndex++
  }
}

// HTMLからPDF生成するヘルパー関数
async function createPDFFromHTML(htmlContent: string): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')
  await (document as any).fonts?.ready

  const widthPx = 800
  const tempDiv = document.createElement('div')
  tempDiv.id = 'pdf-temp-root'
  tempDiv.innerHTML = htmlContent
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.width = `${widthPx}px`
  tempDiv.style.backgroundColor = '#ffffff'
  tempDiv.style.fontFamily = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif'
  tempDiv.style.lineHeight = '1.35'
  tempDiv.style.fontSize = '12px'
  tempDiv.className = 'pdf-root'
  document.body.appendChild(tempDiv)

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 0,
      width: widthPx,
      windowWidth: widthPx,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        const el = clonedDoc.body.querySelector('#pdf-temp-root') as HTMLElement | null
        if (el) {
          el.style.width = `${widthPx}px`
          el.style.overflow = 'visible'
          el.classList.add('pdf-root')
        }
      }
    })

    addCanvasFitToPage(doc, canvas)
  } finally {
    document.body.removeChild(tempDiv)
  }

  return doc
}

// ランキングPDF生成用の型定義
export type RankingPDFData = {
  periodName: string
  periodDates: string
  rankings: {
    rank: number
    name: string
    department: string
    totalScore: number
    previousScore?: number
    scoreChange?: number
  }[]
}

// ランキングPDF生成関数
export async function generateRankingPDF(data: RankingPDFData) {
  const rankingsHTML = data.rankings.map((entry, index) => {
    const changeHTML = entry.scoreChange !== undefined ? `
      <span style="font-size: 11px; color: ${entry.scoreChange > 0 ? '#16a34a' : entry.scoreChange < 0 ? '#dc2626' : '#6b7280'};">
        ${entry.scoreChange > 0 ? '▲' : entry.scoreChange < 0 ? '▼' : '－'}
        ${Math.abs(entry.scoreChange).toFixed(1)}
      </span>
    ` : '<span style="font-size: 11px; color: #6b7280;">-</span>'

    return `
      <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'}; ${entry.rank <= 3 ? 'background: #eff6ff;' : ''}">
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold; font-size: 16px;">
          ${entry.rank}
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 500;">
          ${entry.name}
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; color: #6b7280;">
          ${entry.department}
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">
          <span style="font-size: 20px; font-weight: bold; color: #2563eb;">
            ${entry.totalScore.toFixed(1)}
          </span>
        </td>
        <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">
          ${changeHTML}
        </td>
      </tr>
    `
  }).join('')

  const htmlContent = `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 30px; max-width: 900px;">
      <h1 style="font-size: 28px; margin-bottom: 25px; border-bottom: 3px solid #2563eb; padding-bottom: 12px; color: #1e40af;">
        評価点数ランキング
      </h1>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #2563eb;">
        <p style="margin: 8px 0; font-size: 15px;"><strong>評価期間:</strong> ${data.periodName}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>期間:</strong> ${data.periodDates}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>対象者数:</strong> ${data.rankings.length}名</p>
      </div>

      <table style="width: 100%; table-layout: fixed; border-collapse: collapse;">
        <thead>
          <tr style="background: #2563eb; color: white;">
            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 10%; min-width: 60px;">順位</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 25%; min-width: 120px;">氏名</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: left; width: 25%; min-width: 120px;">部署</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: right; width: 20%; min-width: 100px;">総合スコア</th>
            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 20%; min-width: 100px;">前期比</th>
          </tr>
        </thead>
        <tbody>
          ${rankingsHTML}
        </tbody>
      </table>

      <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; font-size: 12px; color: #1e40af;">
        <p style="margin: 0;"><strong>※</strong> 最終評価の総合スコアに基づくランキングです</p>
        <p style="margin: 5px 0 0 0;"><strong>※</strong> 前期比は直前の評価期間の最終評価との比較です</p>
      </div>
    </div>
  `

  const doc = await createPDFFromHTML(htmlContent)
  const fileName = `ranking_${data.periodName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  doc.save(fileName)
}
