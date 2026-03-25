// --- report.js ---
console.log("=== REPORT API HIT : 日本語版 v2026-03-25 ===");
const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { mode, name, checks, cashText, comment, denominations } = req.body || {};

    if (!mode || !name) {
      return res.status(400).json({ error: '入力内容が不足しています' });
    }

    // --- 日時取得 ---
    const now = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    // 戸締り確認のみの場合は金額判定不要
    const isCloseCheck = (mode === '閉店・戸締り確認');

    // 金額の一致判定（戸締り確認の場合はスキップ）
    const isMatch = isCloseCheck ? true : (cashText || '').includes('基準一致');
    const isAlert = !isMatch;
    const alertPrefix = isAlert ? "【要確認・金額不一致】" : "";

    // メール本文を組み立て
    let bodyText = `以下の通り報告がありました。\n\n` +
                   `日時：${now}\n` +
                   `区分：${mode}\n` +
                   `担当者：${name}\n` +
                   `--------------------------\n`;

    if (isCloseCheck) {
      // 戸締り確認のみ
      bodyText += `■戸締りチェック：\n${checks}\n` +
                  `--------------------------\n`;
    } else {
      // 開店 or 閉店・レジ締め
      bodyText += `■チェック状況：\n${checks}\n\n` +
                  `■金種内訳：\n${denominations || '入力なし'}\n\n` +
                  `■釣り銭合計・判定：\n${cashText}\n\n` +
                  `■コメント：\n${comment || 'なし'}\n` +
                  `--------------------------\n` +
                  (isAlert ? "\n※金額が基準と一致していません。内容を確認してください。" : "");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['bar.spec.884@gmail.com'],
      subject: `${alertPrefix}【${mode}報告】${name}様より`,
      text: bodyText
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '送信に失敗しました: ' + err.message });
  }
};
