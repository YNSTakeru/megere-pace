import { NextResponse } from "next/server";

// メモリ上に購読情報を保存（本番ではDB等を利用）
let subscriptions = [];

export async function POST(req) {
  try {
    const { subscription, gps } = await req.json();
    if (!subscription) {
      return NextResponse.json(
        { status: "ng", error: "no subscription" },
        { status: 400 }
      );
    }
    // 1分間、5秒間隔でPush通知を送信
    const sendPush = (count) => {
      const payload = JSON.stringify({
        title: `GPS通知 #${count + 1}`,
        body: gps
          ? `緯度: ${gps.latitude}, 経度: ${gps.longitude}`
          : "GPS情報なし",
        icon: "/favicon.ico",
        data: { url: "/sandbox", gps },
      });
      webpush.sendNotification(subscription, payload).catch(() => {});
    };
    for (let i = 0; i < 12; i++) {
      setTimeout(() => sendPush(i), i * 5000);
    }
    return NextResponse.json({
      status: "ok",
      message: "1分間、5秒間隔でPush通知を送信します",
    });
  } catch (e) {
    return NextResponse.json(
      { status: "ng", error: e.message },
      { status: 500 }
    );
  }
}

// Push通知送信用のエンドポイント例（web-push利用）
// 本番ではVAPID秘密鍵を安全に管理してください
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:example@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function GET() {
  // テスト用: 全購読者にPush通知を送信
  const payload = JSON.stringify({ title: "Hello from Next.js!" });
  const results = await Promise.all(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).then(
        () => ({ success: true }),
        (err) => ({ success: false, error: err.message })
      )
    )
  );
  return NextResponse.json({ results });
}
