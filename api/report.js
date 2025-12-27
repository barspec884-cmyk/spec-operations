// --- report.js ---
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mode, name, checks, cashText, comment, denominations } = req.body || {};

    if (!mode || !name || !cashText) {
      return res.status(400).json({ error: '入力内容が不足しています' });
    }

    const isMatch = cashText.includes('基準一致');
    
    // 開店時は厳格にチェック
    if (mode === '開店' && !isMatch) {
      return res.status(400).json({ error: '開店時の釣り銭が3万円ではありません' });
    }

    // 【修正】閉店時に不一致でもメールは送る。その代わり件名に警告を付ける
    const isAlert = (mode === '閉店' && !isMatch);
    const alertPrefix = isAlert ? "【要確認・金額不一致】" : "";

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['bar.spec.884@gmail.com'], 
      subject: `${alertPrefix}【${mode}報告】${name}様より`,
      text: `以下の通り報告がありました。\n\n` +
            `区分：${mode}\n` +
            `担当者：${name}\n` +
            `--------------------------\n` +
            `■チェック状況：\n${checks}\n\n` + // index.htmlで [済/未] を付けている
            `■金種内訳：\n${denominations || '入力なし'}\n\n` +
            `■釣り銭合計・判定：\n${cashText}\n\n` +
            `■コメント：\n${comment || 'なし'}\n` +
            `--------------------------\n` +
            (isAlert ? "\n※金額が基準と一致していません。コメント欄を確認してください。" : "")
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '送信に失敗しました: ' + err.message });
  }
};