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

export async function generateEvaluationPDF(data: EvaluationPDFData) {
  // HTMLコンテンツを生成
  const evaluationsHTML = data.evaluations.map((evaluation, index) => {
    // 評価項目の表を生成
    const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
      <div style="margin-top: 10px;">
        <h4 style="font-size: 14px; margin-bottom: 8px; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 3px;">評価項目詳細</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px;">
          <thead>
            <tr style="background: #e0e7ff; color: #1e40af;">
              <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 20%;">項目名</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 30%;">説明</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">重み</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">スコア</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 34%;">コメント</th>
            </tr>
          </thead>
          <tbody>
            ${evaluation.items.map((item, i) => `
              <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="padding: 5px; border: 1px solid #cbd5e1;">
                  <strong>${item.name}</strong>
                </td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 10px;">
                  ${item.description}
                  ${item.criteria ? `<br><span style="color: #6b7280; font-size: 9px;">基準: ${item.criteria}</span>` : ''}
                </td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">
                  ${item.weight}
                </td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 14px; color: #3b82f6;">
                  ${item.score}
                </td>
                <td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 10px;">
                  ${item.comment || '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p style="color: #6b7280; margin-top: 10px; font-size: 11px;">※ 評価項目の詳細データがありません</p>'

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
      // 評価項目の表を生成
      const itemsTableHTML = evaluation.items && evaluation.items.length > 0 ? `
        <div style="margin-top: 10px;">
          <h4 style="font-size: 14px; margin-bottom: 8px; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 3px;">評価項目詳細</h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px;">
            <thead>
              <tr style="background: #e0e7ff; color: #1e40af;">
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 20%;">項目名</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 30%;">説明</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">重み</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; width: 8%;">スコア</th>
                <th style="padding: 5px; border: 1px solid #cbd5e1; text-align: left; width: 34%;">コメント</th>
              </tr>
            </thead>
            <tbody>
              ${evaluation.items.map((item, i) => `
                <tr style="background: ${i % 2 === 0 ? '#f9fafb' : 'white'};">
                  <td style="padding: 5px; border: 1px solid #cbd5e1;">
                    <strong>${item.name}</strong>
                  </td>
                  <td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 10px;">
                    ${item.description}
                    ${item.criteria ? `<br><span style="color: #6b7280; font-size: 9px;">基準: ${item.criteria}</span>` : ''}
                  </td>
                  <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">
                    ${item.weight}
                  </td>
                  <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-size: 14px; color: #3b82f6;">
                    ${item.score}
                  </td>
                  <td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 10px;">
                    ${item.comment || '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color: #6b7280; margin-top: 10px; font-size: 11px;">※ 評価項目の詳細データがありません</p>'

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

// HTMLからPDF生成するヘルパー関数
async function createPDFFromHTML(htmlContent: string): Promise<jsPDF> {
  const doc = new jsPDF('p', 'mm', 'a4')

  // 一時的なDIV要素を作成
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent
  tempDiv.style.position = 'absolute'
  tempDiv.style.left = '-9999px'
  tempDiv.style.width = '800px'
  tempDiv.style.backgroundColor = '#ffffff'
  document.body.appendChild(tempDiv)

  try {
    // HTMLをcanvasに変換
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    })

    // canvasを画像に変換してPDFに追加
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 190 // A4サイズに合わせる (210mm - 20mm margin)
    const pageHeight = 277 // A4サイズの高さ (297mm - 20mm margin)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 10

    // 最初のページに画像を追加
    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 必要に応じて追加ページを作成
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10
      doc.addPage()
      doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
  } finally {
    // 一時DIVを削除
    document.body.removeChild(tempDiv)
  }

  return doc
}
