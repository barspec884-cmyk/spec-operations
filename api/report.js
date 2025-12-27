import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    mode,
    name,
    checks,
    cashText,
    comment
  } = req.body;


  // 最低限のサーバ側バリデーション
  if (!mode || !name || !cashText) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // 開店ルール強制
  if (mode === '開店' && !cashText.includes('基準一致')) {
    return res.status(400).json({
      error: 'Opening cash mismatch'
    });
  }

  // 閉店ルール強制
  if (mode === '閉店' && !cashText.includes('基準一致') && !comment) {
    return res.status(400).json({
      error: 'Closing reason required'
    });
  }

  const subject = `【${mode}チェック完了】${name}`;

  const body = `
【業務チェック報告】
区分：${mode}
担当者：${name}

■ チェック項目
${checks || 'なし'}

■ 釣り銭
${cashText}

■ コメント
${comment || 'なし'}
`;

  try {
    await resend.emails.send({
      from: 'Bar SPEC <noreply@uspot.jp>',
      to: ['bar-spec@uspot.jp'],
      subject,
      text: body
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Mail send failed' });
  }
}
cument