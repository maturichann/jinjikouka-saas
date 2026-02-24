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

  let isFirstPage = true
  for (const evaluation of data.evaluations) {
    const html = buildEvaluationHTML(evaluation, data.evaluatee, data.department, data.period)
    await addPageFromHTML(doc, html, !isFirstPage, true)
    isFirstPage = false
  }

  const fileName = `evaluation_${data.evaluatee.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  doc.save(fileName)
}

export async function generateMultipleEvaluationsPDF(evaluationsData: EvaluationPDFData[]) {
  const doc = new jsPDF('p', 'mm', 'a4')
  await (document as any).fonts?.ready

  let isFirstPage = true
  for (const data of evaluationsData) {
    for (const evaluation of data.evaluations) {
      const html = buildEvaluationHTML(evaluation, data.evaluatee, data.department, data.period)
      await addPageFromHTML(doc, html, !isFirstPage, true)
      isFirstPage = false
    }
  }

  const fileName = `evaluations_report_${Date.now()}.pdf`
  doc.save(fileName)
}

// NOTE: innerHTML使用はPDF生成用の内部データのみ（ユーザー入力はサニタイズ済み）
function buildEvaluationHTML(
  evaluation: EvaluationPDFData['evaluations'][0],
  evaluatee: string,
  department: string,
  period: string
): string {
  const itemCount = evaluation.items?.length || 0
  // 項目数に応じてサイズ調整（少ない場合は大きく、多い場合はコンパクトに）
  const fontSize = itemCount > 40 ? '8px' : itemCount > 30 ? '9px' : '10px'
  const smallFontSize = itemCount > 40 ? '7.5px' : itemCount > 30 ? '8px' : '9px'
  const cellPadding = itemCount > 40 ? '3px 4px' : itemCount > 30 ? '4px 5px' : '5px 6px'
  const scoreFontSize = itemCount > 40 ? '9px' : itemCount > 30 ? '10px' : '11px'
  const headerFontSize = itemCount > 40 ? '8.5px' : itemCount > 30 ? '9px' : '10px'

  const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: ${fontSize}; line-height: 1.35;">
      <thead>
        <tr style="background: #1e40af; color: white;">
          <th style="padding: ${cellPadding}; border: 1px solid #1e3a8a; text-align: left; width: 20%; font-size: ${headerFontSize};">項目名</th>
          <th style="padding: ${cellPadding}; border: 1px solid #1e3a8a; text-align: left; width: 24%; font-size: ${headerFontSize};">説明</th>
          <th style="padding: ${cellPadding}; border: 1px solid #1e3a8a; text-align: center; width: 7%; font-size: ${headerFontSize};">評価</th>
          <th style="padding: ${cellPadding}; border: 1px solid #1e3a8a; text-align: center; width: 7%; font-size: ${headerFontSize};">点数</th>
          <th style="padding: ${cellPadding}; border: 1px solid #1e3a8a; text-align: left; width: 42%; font-size: ${headerFontSize};">コメント</th>
        </tr>
      </thead>
      <tbody>
        ${evaluation.items.map((item, i) => `
          <tr style="background: ${i % 2 === 0 ? '#f8fafc' : 'white'};">
            <td style="padding: ${cellPadding}; border: 1px solid #e2e8f0; font-size: ${fontSize}; vertical-align: top; overflow-wrap: anywhere; word-break: break-word;">
              ${item.name}
            </td>
            <td style="padding: ${cellPadding}; border: 1px solid #e2e8f0; font-size: ${smallFontSize}; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; color: #475569;">
              ${item.description || '-'}
            </td>
            <td style="padding: ${cellPadding}; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: ${scoreFontSize}; color: #1e293b; vertical-align: top;">
              ${item.grade === 'HOLD' ? '<span style="color:#f97316;">保留</span>' : item.grade || '-'}
            </td>
            <td style="padding: ${cellPadding}; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: ${scoreFontSize}; color: #2563eb; vertical-align: top;">
              ${item.grade === 'HOLD' ? '-' : item.score || 0}
            </td>
            <td style="padding: ${cellPadding}; border: 1px solid #e2e8f0; font-size: ${smallFontSize}; vertical-align: top; overflow-wrap: anywhere; word-break: break-word;">
              ${item.comment || '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #6b7280; font-size: 10px;">※ 評価項目の詳細データがありません</p>'

  const overallCommentHTML = evaluation.overall_comment ? `
    <div style="margin-top: 5px; padding: 5px 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
      <strong style="font-size: 9px; color: #991b1b;">総評:</strong>
      <span style="font-size: 8.5px; color: #1f2937;"> ${evaluation.overall_comment}</span>
    </div>
  ` : ''

  return `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 4px 8px; max-width: 800px;">
      <div style="background: #1e40af; color: white; padding: 6px 12px; border-radius: 4px 4px 0 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: bold;">${evaluatee}（${department}）</span>
          <span style="font-size: 11px;">${evaluation.stage} | 総合: ${evaluation.totalScore.toFixed(1)}点</span>
        </div>
        <div style="font-size: 9px; margin-top: 2px; opacity: 0.9;">${period} | ${evaluation.submittedAt}</div>
      </div>
      <div style="margin-top: 2px;">
        ${itemsTableHTML}
      </div>
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
  tempDiv.style.lineHeight = '1.3'
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

// canvasを1ページにフィットさせて追加
function addCanvasFitToPage(doc: jsPDF, canvas: HTMLCanvasElement) {
  const marginMm = 5
  const pageWidthMm = 210
  const pageHeightMm = 297
  const contentWidthMm = pageWidthMm - marginMm * 2
  const contentHeightMm = pageHeightMm - marginMm * 2

  const mmPerPxWidth = contentWidthMm / canvas.width
  const originalHeightMm = canvas.height * mmPerPxWidth

  let finalWidthMm = contentWidthMm
  let finalHeightMm = originalHeightMm

  if (originalHeightMm > contentHeightMm) {
    const scale = contentHeightMm / originalHeightMm
    finalWidthMm = contentWidthMm * scale
    finalHeightMm = contentHeightMm
  }

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
