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

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 403エラーを避けるための最小構成送信
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['amber.palette.spec@gmail.com'], // Resendに登録したGmailアドレスと完全一致させる必要があります
      subject: `【${mode}報告】${name}様`,
      text: `【業務チェック報告】\n区分：${mode}\n担当者：${name}\n\n■ 釣り銭\n${cashText}\n\n■ コメント\n${comment || 'なし'}`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    // 詳細なエラーメッセージを返すようにします
    return res.status(500).json({ error: '送信エラー: ' + err.message });
  }
};