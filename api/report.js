const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      mode,
      name,
      checks,
      cashText,
      comment
    } = req.body || {};

    if (!mode || !name || !cashText) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (mode === '開店' && !cashText.includes('基準一致')) {
      return res.status(400).json({ error: 'Opening cash mismatch' });
    }

    if (mode === '閉店' && !cashText.includes('基準一致') && !comment) {
      return res.status(400).json({ error: 'Closing reason required' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Bar SPEC <noreply@uspot.jp>',
      to: ['bar-spec@uspot.jp'],
      subject: `【${mode}チェック完了】${name}`,
      text: `
【業務チェック報告】
区分：${mode}
担当者：${name}

■ チェック項目
${checks || 'なし'}

■ 釣り銭
${cashText}

■ コメント
${comment || 'なし'}
`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
