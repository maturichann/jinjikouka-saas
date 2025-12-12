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
  // HTMLコンテンツを生成
  const evaluationsHTML = data.evaluations.map((evaluation, index) => {
    // 評価項目の表を生成（50項目対応で超コンパクト）
    const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
      <div style="margin-top: 5px;">
        <h4 style="font-size: 10px; margin-bottom: 4px; color: #1e40af; border-bottom: 1px solid #3b82f6; padding-bottom: 2px;">評価項目詳細</h4>
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 3px; font-size: 7px; line-height: 1.35;">
          <thead>
            <tr style="background: #e0e7ff; color: #1e40af;">
              <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 15%; min-width: 80px; box-sizing: border-box; vertical-align: top;">項目名</th>
              <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 20%; min-width: 100px; box-sizing: border-box; vertical-align: top;">説明</th>
              <th style="padding: 0; border: 1px solid #cbd5e1; width: 6%; min-width: 30px; box-sizing: border-box; vertical-align: top;">
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">重み</div>
              </th>
              <th style="padding: 0; border: 1px solid #cbd5e1; width: 8%; min-width: 45px; box-sizing: border-box; vertical-align: top;">
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">グレード</div>
              </th>
              <th style="padding: 0; border: 1px solid #cbd5e1; width: 8%; min-width: 45px; box-sizing: border-box; vertical-align: top;">
                <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">スコア</div>
              </th>
              <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 43%; min-width: 200px; box-sizing: border-box; vertical-align: top;">コメント</th>
            </tr>
          </thead>
          <tbody>
            ${evaluation.items.map((item, i) => `
              <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 7px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                  ${item.name}
                </td>
                <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 6px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                  ${item.description}
                </td>
                <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-size: 7px; white-space: nowrap;">${item.weight}</div>
                </td>
                <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-weight: bold; font-size: 8px; color: #374151; white-space: nowrap;">${item.grade || '-'}</div>
                </td>
                <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-weight: bold; font-size: 9px; color: #3b82f6; white-space: nowrap;">${item.score}</div>
                </td>
                <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 6px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                  ${item.comment || '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p style="color: #6b7280; margin-top: 5px; font-size: 7px;">※ 評価項目の詳細データがありません</p>'

    const overallCommentHTML = evaluation.overall_comment ? `
      <div style="margin-top: 10px; padding: 10px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">総評コメント</h4>
        <p style="margin: 0; font-size: 11px; color: #1f2937; white-space: pre-wrap; line-height: 1.6;">${evaluation.overall_comment}</p>
      </div>
    ` : ''

    return `
      <div style="page-break-before: ${index > 0 ? 'always' : 'auto'}; page-break-after: always;">
        <div style="background: #3b82f6; color: white; padding: 10px; border-radius: 8px 8px 0 0; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px;">${evaluation.stage} - 総合スコア: ${evaluation.totalScore.toFixed(1)}</h3>
        </div>
        <div style="padding: 8px; background: #f9fafb; border-radius: 0 0 8px 8px; margin-bottom: 8px;">
          <p style="margin: 3px 0; font-size: 12px;"><strong>ステータス:</strong> ${evaluation.status}</p>
          <p style="margin: 3px 0; font-size: 12px;"><strong>提出日:</strong> ${evaluation.submittedAt}</p>
        </div>
        ${itemsTableHTML}
        ${overallCommentHTML}
      </div>
    `
  }).join('')

  const summaryHTML = `
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
  `

  const htmlContent = `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 30px; max-width: 800px;">
      <h1 style="font-size: 28px; margin-bottom: 25px; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; color: #1e40af;">
        評価レポート
      </h1>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
        <p style="margin: 8px 0; font-size: 15px;"><strong>評価対象者:</strong> ${data.evaluatee}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>部署:</strong> ${data.department}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>評価期間:</strong> ${data.period}</p>
      </div>

      <h2 style="font-size: 20px; margin: 25px 0 15px; color: #1e40af; border-left: 4px solid #3b82f6; padding-left: 12px;">
        評価詳細
      </h2>
      ${evaluationsHTML}

      <h2 style="font-size: 20px; margin: 30px 0 15px; color: #1e40af; border-left: 4px solid #22c55e; padding-left: 12px;">
        サマリー
      </h2>
      ${summaryHTML}
    </div>
  `

  // HTMLからPDFを生成
  const doc = await createPDFFromHTML(htmlContent)

  // ファイル名を生成
  const fileName = `evaluation_${data.evaluatee.replace(/\s+/g, '_')}_${Date.now()}.pdf`

  // PDFをダウンロード
  doc.save(fileName)
}

export async function generateMultipleEvaluationsPDF(evaluationsData: EvaluationPDFData[]) {
  const itemsHTML = evaluationsData.map((data, dataIndex) => {
    // 各対象者の評価段階ごとのHTMLを生成
    const evaluationsHTML = data.evaluations.map((evaluation, evalIndex) => {
      // 評価項目の表を生成（50項目対応で超コンパクト）
      const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
        <div style="margin-top: 5px;">
          <h4 style="font-size: 10px; margin-bottom: 4px; color: #1e40af; border-bottom: 1px solid #3b82f6; padding-bottom: 2px;">評価項目詳細</h4>
          <table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 3px; font-size: 7px; line-height: 1.35;">
            <thead>
              <tr style="background: #e0e7ff; color: #1e40af;">
                <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 15%; min-width: 80px; box-sizing: border-box; vertical-align: top;">項目名</th>
                <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 20%; min-width: 100px; box-sizing: border-box; vertical-align: top;">説明</th>
                <th style="padding: 0; border: 1px solid #cbd5e1; width: 6%; min-width: 30px; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">重み</div>
                </th>
                <th style="padding: 0; border: 1px solid #cbd5e1; width: 8%; min-width: 45px; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">グレード</div>
                </th>
                <th style="padding: 0; border: 1px solid #cbd5e1; width: 8%; min-width: 45px; box-sizing: border-box; vertical-align: top;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; white-space: nowrap;">スコア</div>
                </th>
                <th style="padding: 4px 3px; border: 1px solid #cbd5e1; text-align: left; width: 43%; min-width: 200px; box-sizing: border-box; vertical-align: top;">コメント</th>
              </tr>
            </thead>
            <tbody>
              ${evaluation.items.map((item, i) => `
                <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
                  <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 7px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                    ${item.name}
                  </td>
                  <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 6px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                    ${item.description}
                  </td>
                  <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-size: 7px; white-space: nowrap;">${item.weight}</div>
                  </td>
                  <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-weight: bold; font-size: 8px; color: #374151; white-space: nowrap;">${item.grade || '-'}</div>
                  </td>
                  <td style="padding: 0; border: 1px solid #cbd5e1; box-sizing: border-box; vertical-align: top;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 4px 3px; box-sizing: border-box; font-weight: bold; font-size: 9px; color: #3b82f6; white-space: nowrap;">${item.score}</div>
                  </td>
                  <td style="padding: 4px 3px; border: 1px solid #cbd5e1; font-size: 6px; box-sizing: border-box; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; line-break: strict;">
                    ${item.comment || '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color: #6b7280; margin-top: 5px; font-size: 7px;">※ 評価項目の詳細データがありません</p>'

      const overallCommentHTML = evaluation.overall_comment ? `
        <div style="margin-top: 10px; padding: 10px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">総評コメント</h4>
          <p style="margin: 0; font-size: 11px; color: #1f2937; white-space: pre-wrap; line-height: 1.6;">${evaluation.overall_comment}</p>
        </div>
      ` : ''

      return `
        <div style="page-break-before: ${evalIndex > 0 || dataIndex > 0 ? 'always' : 'auto'}; page-break-after: always;">
          <div style="background: #3b82f6; color: white; padding: 10px; border-radius: 8px 8px 0 0; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px;">${evaluation.stage} - 総合スコア: ${evaluation.totalScore.toFixed(1)}</h3>
          </div>
          <div style="padding: 8px; background: #f9fafb; border-radius: 0 0 8px 8px; margin-bottom: 8px;">
            <p style="margin: 3px 0; font-size: 12px;"><strong>対象者:</strong> ${data.evaluatee} | <strong>部署:</strong> ${data.department}</p>
            <p style="margin: 3px 0; font-size: 12px;"><strong>ステータス:</strong> ${evaluation.status} | <strong>提出日:</strong> ${evaluation.submittedAt}</p>
          </div>
          ${itemsTableHTML}
          ${overallCommentHTML}
        </div>
      `
    }).join('')

    return evaluationsHTML
  }).join('')

  const htmlContent = `
    <div style="font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif; padding: 30px; max-width: 800px;">
      <h1 style="font-size: 28px; margin-bottom: 25px; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; color: #1e40af;">
        評価レポート - 複数対象者
      </h1>
      ${itemsHTML}
    </div>
  `

  // HTMLからPDFを生成
  const doc = await createPDFFromHTML(htmlContent)

  const fileName = `evaluations_report_${Date.now()}.pdf`
  doc.save(fileName)
}

// canvasをページごとにスライスしてPDFに追加（行の途中で切れるのを防止）
function addCanvasToPdfBySlicing(doc: jsPDF, canvas: HTMLCanvasElement) {
  const marginMm = 10
  const pageWidthMm = 210
  const pageHeightMm = 297
  const contentWidthMm = pageWidthMm - marginMm * 2
  const contentHeightMm = pageHeightMm - marginMm * 2

  // px→mm換算（貼り付け幅に合わせてスケール）
  const mmPerPx = contentWidthMm / canvas.width
  const pageHeightPx = Math.floor(contentHeightMm / mmPerPx)

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

    if (pageIndex > 0) doc.addPage()

    const sliceHeightMm = sliceHeight * mmPerPx
    doc.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm)

    y += sliceHeight
    pageIndex++
  }
}

// HTMLからPDF生成するヘルパー関数
async function createPDFFromHTML(htmlContent: string): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')

  // フォントロード完了を待つ（日本語フォント対応）
  await (document as any).fonts?.ready

  // 一時的なDIV要素を作成
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
    // HTMLをcanvasに変換
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
        // クローン側にPDF専用のスタイルを強制
        const el = clonedDoc.body.querySelector('#pdf-temp-root') as HTMLElement | null
        if (el) {
          el.style.width = `${widthPx}px`
          el.style.overflow = 'visible'
          el.classList.add('pdf-root')
        }
      }
    })

    // canvasをページごとにスライスして追加（見切れ防止）
    addCanvasToPdfBySlicing(doc, canvas)
  } finally {
    // 一時DIVを削除
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
            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 20%; min-width: 100px;">前年比</th>
          </tr>
        </thead>
        <tbody>
          ${rankingsHTML}
        </tbody>
      </table>

      <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-radius: 8px; font-size: 12px; color: #1e40af;">
        <p style="margin: 0;"><strong>※</strong> 最終評価の総合スコアに基づくランキングです</p>
        <p style="margin: 5px 0 0 0;"><strong>※</strong> 前年比は前年度同時期の最終評価との比較です</p>
      </div>
    </div>
  `

  const doc = await createPDFFromHTML(htmlContent)
  const fileName = `ranking_${data.periodName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
  doc.save(fileName)
}
