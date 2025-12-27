const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mode, name, checks, cashText, comment } = req.body || {};

    if (!mode || !name || !cashText) {
      return res.status(400).json({ error: '入力内容が不足しています' });
    }

    // 金額チェックのロジック
    const isMatch = cashText.includes('基準一致');
    if (mode === '開店' && !isMatch) {
      return res.status(400).json({ error: '開店時の釣り銭が3万円ではありません' });
    }
    if (mode === '閉店' && !isMatch && !comment) {
      return res.status(400).json({ error: '差異がある場合はコメントを入力してください' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Bar SPEC <noreply@uspot.jp>', // ※Resendでドメイン認証済みである必要があります
      to: ['bar-spec@uspot.jp'],
      subject: `【${mode}チェック完了】${name}`,
      text: `【業務チェック報告】\n区分：${mode}\n担当者：${name}\n\n■ チェック項目\n${checks || 'なし'}\n\n■ 釣り銭\n${cashText}\n\n■ コメント\n${comment || 'なし'}`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '送信に失敗しました: ' + err.message });
  }
};