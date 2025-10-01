import { NextResponse } from "next/server";

// メモリ上に購読情報を保存（本番ではDB等を利用）
let subscriptions = [];

export async function POST(req) {
  try {
    const { subscription } = await req.json();
    if (!subscription) {
      return NextResponse.json(
        { status: "ng", error: "no subscription" },
        { status: 400 }
      );
    }
    // ここで受け取った購読者だけにPush通知
    const payload = JSON.stringify({
      title: "個別Push通知",
      body: "あなたにだけ届く通知です",
      icon: "/favicon.ico",
      data: { url: "/sandbox" },
    });
    try {
      await webpush.sendNotification(subscription, payload);
      return NextResponse.json({ status: "ok" });
    } catch (err) {
      return NextResponse.json(
        { status: "ng", error: err.message },
        { status: 500 }
      );
    }
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
