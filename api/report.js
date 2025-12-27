const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // 金種(denominations)をリクエストボディに追加
    const { mode, name, checks, cashText, comment, denominations } = req.body || {};

    if (!mode || !name || !cashText) {
      return res.status(400).json({ error: '入力内容が不足しています' });
    }

    // 金額チェックのロジック
    const isMatch = cashText.includes('基準一致');
    
    // 開店時は3万円固定なのでエラーチェックを継続
    if (mode === '開店' && !isMatch) {
      return res.status(400).json({ error: '開店時の釣り銭が3万円ではありません' });
    }

    // 【修正】閉店時にコメントがなくてもメールは送信されるよう、ここでのreturn(400)を解除
    // その代わり、メール本文に注意書きを追加するロジックにします
    const alertPrefix = (!isMatch && mode === '閉店' && !comment) ? "【！要確認！】" : "";

    const resend = new Resend(process.env.RESEND_API_KEY);

    // メール送信処理
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['bar.spec.884@gmail.com'], 
      subject: `${alertPrefix}【${mode}報告】${name}様より`,
      text: `以下の通り報告がありました。\n\n` +
            `区分：${mode}\n` +
            `担当者：${name}\n` +
            `--------------------------\n` +
            `■チェック事項（完了/未完了）：\n${checks || 'チェックなし'}\n\n` +
            `■金種内訳：\n${denominations || '入力なし'}\n\n` +
            `■釣り銭合計・判定：\n${cashText}\n\n` +
            `■コメント：\n${comment || 'なし'}\n` +
            `--------------------------\n` +
            (alertPrefix ? "\n※差異がありますがコメントが入力されていません。確認が必要です。" : "")
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '送信に失敗しました: ' + err.message });
  }
};