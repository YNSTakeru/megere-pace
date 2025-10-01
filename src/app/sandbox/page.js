"use client";
import { useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; // 環境変数からVAPID公開鍵を取得

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function Page() {
  const [result, setResult] = useState("");

  async function subscribe() {
    if (!("serviceWorker" in navigator)) {
      setResult("Service Worker未対応のブラウザです");
      return;
    }
    try {
      // Service Worker登録
      const reg = await navigator.serviceWorker.register("/serviceworker.js");
      await navigator.serviceWorker.ready;
      if (!reg.pushManager) {
        setResult("pushManagerが有効ではありません（iOS Safari等）");
        return;
      }
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      // サーバーに購読情報を送信
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (res.ok) {
        setResult(
          "購読成功: " + JSON.stringify(subscription.toJSON(), null, 2)
        );
      } else {
        setResult("サーバーへの購読情報送信失敗");
      }
      console.log("Subscription token:", subscription.toJSON());
    } catch (e) {
      setResult("購読失敗: " + e.message);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Push通知購読デモ</h2>
      <button onClick={subscribe}>Subscribe</button>
      <pre style={{ marginTop: 16, background: "#f5f5f5", padding: 8 }}>
        {result}
      </pre>
    </div>
  );
}
