"use client";

import { useEffect, useRef, useState } from "react";
import { useGPS } from "../hooks/useGPS";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millisecs = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, "0")}.${millisecs
    .toString()
    .padStart(2, "0")}`;
};

const formatPace = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function Home() {
  // 音声案内再生関数（Chrome/Safari両対応）
  const speakWelcome = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(
        "ペースメーカーアプリへようこそ。スタートボタンで計測を開始できます。"
      );
      utter.lang = "ja-JP";
      window.speechSynthesis.speak(utter);
    }
  };
  // サイトアクセス時に音声読み上げ
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Safari等の制約を考慮し、ユーザー操作なしでも一度だけ発話を試みる
      const utter = new window.SpeechSynthesisUtterance(
        "ペースメーカーアプリへようこそ。スタートボタンで計測を開始できます。"
      );
      utter.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    }
  }, []);
  // 区間距離の選択状態
  const [segmentLength, setSegmentLength] = useState(100);
  const {
    position,
    isTracking,
    error,
    totalDistance,
    paceData,
    currentPace,
    averagePace,
    isTestMode,
    startTracking,
    stopTracking,
    addManualPace,
    toggleTestMode,
    resetTracking,
  } = useGPS(segmentLength);

  const startPressStart = useRef(null);
  const resetPressStart = useRef(null);
  const stopPressStart = useRef(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isTracking) {
        // 必要なら再度GPS計測を開始
        startTracking();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isTracking]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* 音声案内ボタン */}
          <div className="mb-4 flex justify-center">
            <button
              onClick={speakWelcome}
              className="px-4 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors"
              style={{ userSelect: "none" }}
            >
              案内を聞く
            </button>
          </div>
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🏃‍♂️ ペースメーカー
            </h1>
            <p className="text-gray-600">{segmentLength}m毎のペースを計測</p>
            {/* 区間距離切り替えセレクトボックス */}
            <div className="mt-4 flex justify-center items-center gap-2">
              <label
                htmlFor="segmentLength"
                className="text-sm text-gray-700 font-medium"
              >
                区間:
              </label>
              <select
                id="segmentLength"
                value={segmentLength}
                onChange={(e) => {
                  setSegmentLength(Number(e.target.value));
                  resetTracking();
                }}
                className="px-2 py-1 rounded border border-gray-300 text-sm"
              >
                <option value={100}>100m</option>
                <option value={500}>500m</option>
                <option value={1000}>1000m</option>
              </select>
            </div>
            {/* テストモード切り替え（スマホでは非表示） */}
            <div className="mt-4 hidden sm:block">
              <button
                onClick={toggleTestMode}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isTestMode
                    ? "bg-purple-500 text-white hover:bg-purple-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {isTestMode ? "🧪 テストモード" : "🌍 リアルGPS"}
              </button>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* メイン情報表示 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalDistance.toFixed(0)}m
                </div>
                <div className="text-sm text-gray-500">総距離</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {paceData.length}
                </div>
                <div className="text-sm text-gray-500">完了セグメント</div>
              </div>
            </div>

            {/* 現在のペース */}
            {currentPace && (
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-purple-600">
                  {formatTime(currentPace)}
                </div>
                <div className="text-sm text-gray-500">最新100mペース</div>
              </div>
            )}

            {/* 平均ペース */}
            {averagePace && (
              <div className="text-center mb-6">
                <div className="text-xl font-semibold text-orange-600">
                  平均: {formatTime(averagePace)}
                </div>
                <div className="text-sm text-gray-500">100m平均ペース</div>
              </div>
            )}

            {/* GPS情報 */}
            {position && (
              <div className="text-xs text-gray-400 text-center mb-4">
                精度: {position.accuracy.toFixed(0)}m
              </div>
            )}
          </div>

          {/* コントロールボタン */}
          <div className="flex gap-3 mb-6">
            {!isTracking ? (
              <button
                onClick={startTracking}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                style={{ userSelect: "none" }}
              >
                {isTestMode ? "🧪 テスト開始" : "📍 スタート"}
              </button>
            ) : (
              <button
                onPointerDown={() => {
                  stopPressStart.current = Date.now();
                }}
                onPointerUp={() => {
                  if (Date.now() - stopPressStart.current > 1000) {
                    stopTracking();
                  }
                  stopPressStart.current = null;
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                style={{ userSelect: "none" }}
              >
                ⏹️ ストップ（長押し）
              </button>
            )}
            <button
              onPointerDown={() => {
                resetPressStart.current = Date.now();
              }}
              onPointerUp={() => {
                if (Date.now() - resetPressStart.current > 1000) {
                  resetTracking();
                }
                resetPressStart.current = null;
              }}
              onSelect={(e) => {
                e.preventDefault();
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              style={{ userSelect: "none" }}
            >
              🔄 リセット（長押し）
            </button>
          </div>

          {/* テストモード用手動ペース追加 */}
          {isTestMode && !isTracking && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-bold text-purple-800 mb-3">
                手動ペース追加
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addManualPace(45 + Math.random() * 10)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                  style={{ userSelect: "none" }}
                >
                  高速 (45-55s)
                </button>
                <button
                  onClick={() => addManualPace(55 + Math.random() * 10)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                  style={{ userSelect: "none" }}
                >
                  普通 (55-65s)
                </button>
                <button
                  onClick={() => addManualPace(65 + Math.random() * 15)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
                  style={{ userSelect: "none" }}
                >
                  低速 (65-80s)
                </button>
              </div>
            </div>
          )}

          {/* ペースデータ履歴 */}
          {paceData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                100mセグメント履歴
              </h2>
              <div className="max-h-64 overflow-y-auto">
                {paceData
                  .slice()
                  .reverse()
                  .map((data, index) => {
                    const originalIndex = paceData.length - index;
                    const paceColor =
                      data.time < 60
                        ? "text-green-600"
                        : data.time < 90
                        ? "text-yellow-600"
                        : "text-red-600";

                    return (
                      <div
                        key={originalIndex}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div
                          className="font-medium text-gray-700"
                          style={{
                            fontSize: "30px",
                            userSelect: "none",
                          }}
                        >
                          #{originalIndex} ({segmentLength}m)
                        </div>
                        <div
                          className={`font-bold ${paceColor}`}
                          style={{
                            fontSize: "30px",
                            userSelect: "none",
                          }}
                        >
                          {formatTime(data.time)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 使用方法 */}
          {!isTracking && paceData.length === 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h3 className="font-bold text-blue-800 mb-2">使い方</h3>
              {isTestMode ? (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • 🧪 <strong>テストモード</strong>: GPS不要でテスト可能
                  </li>
                  <li>• 「テスト開始」で自動的にランダムペースを生成</li>
                  <li>• または手動ペース追加ボタンでテスト</li>
                  <li>• 室内でのアプリテストに最適</li>
                </ul>
              ) : (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 「スタート」ボタンを押してGPS計測開始</li>
                  <li>• 100m毎に自動でペースを記録</li>
                  <li>• リアルタイムで距離とペースを確認</li>
                  <li>• 屋外での使用を推奨します</li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
