import { useCallback, useRef, useState } from "react";

/**
 * バックグラウンド動作維持用カスタムフック
 * - 無音またはユーザー選択のmp3をループ再生
 * - Media Session APIでロック画面に情報表示
 * - 再生開始/停止/ファイル切替メソッドを提供
 * - useGPS.jsと併用可能なインターフェース
 */
export function useBackgroundStayAlive() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState("/audio/silent.mp3");
  const [fileName, setFileName] = useState("無音ファイル");

  // Media Session APIのメタデータ設定
  const setMediaSession = useCallback(() => {
    if (typeof window === "undefined" || !navigator.mediaSession) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: "ランニング計測中...",
      artist: "Megere Pace",
      album: "",
      artwork: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
    });
    navigator.mediaSession.setActionHandler("play", startStayAlive);
    navigator.mediaSession.setActionHandler("pause", stopStayAlive);
  }, []);

  // 再生開始
  const startStayAlive = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new window.Audio(audioFile);
      audioRef.current.loop = true;
      audioRef.current.preload = "auto";
    }
    audioRef.current.src = audioFile;
    audioRef.current.loop = true;
    audioRef.current.preload = "auto";
    setMediaSession();
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      // Autoplay Policy違反時はユーザー操作後に再試行
      setIsPlaying(false);
    }
  }, [audioFile, setMediaSession]);

  // 再生停止
  const stopStayAlive = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // ユーザーがmp3ファイルを選択した場合
  const handleFileChange = useCallback(
    (file) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setFileName(file.name);
      // 既存再生中なら切り替え
      if (isPlaying) {
        stopStayAlive();
        setTimeout(() => startStayAlive(), 100);
      }
    },
    [isPlaying, startStayAlive, stopStayAlive],
  );

  return {
    isPlaying,
    audioFile,
    fileName,
    startStayAlive,
    stopStayAlive,
    handleFileChange,
  };
}
