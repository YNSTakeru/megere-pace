"use client";

import { useEffect, useRef, useState } from "react";

// 2点間の距離を計算する関数（Haversine公式）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useGPS = (segmentLength = 100) => {
  const [position, setPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [paceData, setPaceData] = useState([]);
  const [currentPace, setCurrentPace] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);

  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastPositionRef = useRef(null);
  const segmentStartTimeRef = useRef(null);
  const segmentDistanceRef = useRef(0);
  const mockIntervalRef = useRef(null);
  const mockDistanceRef = useRef(0);

  // 音声通知関数
  const notifySegment = (segment, pace) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const msg = new window.SpeechSynthesisUtterance(
        `${segment * segmentLength}メートル通過。${Math.round(pace)}秒です。`
      );
      msg.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    }
  };

  const startTracking = () => {
    if (isTestMode) {
      startMockTracking();
      return;
    }

    if (!navigator.geolocation) {
      setError("お使いのブラウザはGeolocation APIをサポートしていません");
      return;
    }

    setIsTracking(true);
    setError(null);
    setTotalDistance(0);
    setPaceData([]);
    startTimeRef.current = Date.now();
    segmentStartTimeRef.current = Date.now();
    segmentDistanceRef.current = 0;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };

        setPosition(newPosition);

        if (lastPositionRef.current) {
          const distance = calculateDistance(
            lastPositionRef.current.latitude,
            lastPositionRef.current.longitude,
            newPosition.latitude,
            newPosition.longitude
          );

          // 精度が低すぎる場合は無視
          if (newPosition.accuracy > 20) {
            return;
          }

          // 距離が極端に大きい場合は無視（GPS誤差対策）
          if (distance > 50) {
            return;
          }

          const newTotalDistance = totalDistance + distance;
          setTotalDistance(newTotalDistance);

          segmentDistanceRef.current += distance;

          // 100m毎のペース計算 → segmentLength毎に変更
          if (segmentDistanceRef.current >= segmentLength) {
            const segmentTime = Date.now() - segmentStartTimeRef.current;
            const pace = segmentTime / 1000; // 秒
            setPaceData((prev) => {
              const newArr = [
                ...prev,
                {
                  segment: prev.length + 1,
                  distance: segmentLength,
                  time: pace,
                  timestamp: Date.now(),
                },
              ];
              notifySegment(newArr.length, pace);
              return newArr;
            });
            setCurrentPace(pace);
            segmentStartTimeRef.current = Date.now();
            segmentDistanceRef.current = 0;
          }
        }

        lastPositionRef.current = newPosition;
      },
      (err) => {
        setError(`GPS エラー: ${err.message}`);
        console.error(err);
      },
      options
    );
  };

  // テストモード用のモック追跡開始
  const startMockTracking = () => {
    setIsTracking(true);
    setError(null);
    setTotalDistance(0);
    setPaceData([]);
    startTimeRef.current = Date.now();
    segmentStartTimeRef.current = Date.now();
    segmentDistanceRef.current = 0;
    mockDistanceRef.current = 0;

    // モック位置を設定
    setPosition({
      latitude: 35.6762,
      longitude: 139.6503,
      accuracy: 5,
      timestamp: Date.now(),
    });

    // 3-8秒間隔でランダムにペースを生成
    const mockInterval = () => {
      const randomTime = 3000 + Math.random() * 5000; // 3-8秒
      const pace = 45 + Math.random() * 30; // 45-75秒のランダムペース

      mockDistanceRef.current += segmentLength;
      setTotalDistance(mockDistanceRef.current);
      setPaceData((prev) => {
        const newArr = [
          ...prev,
          {
            segment: prev.length + 1,
            distance: segmentLength,
            time: pace,
            timestamp: Date.now(),
          },
        ];
        notifySegment(newArr.length, pace);
        return newArr;
      });
      setCurrentPace(pace);
      if (mockIntervalRef.current) {
        mockIntervalRef.current = setTimeout(mockInterval, randomTime);
      }
    };

    mockIntervalRef.current = setTimeout(mockInterval, 2000);
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearTimeout(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    setIsTracking(false);
  };

  const resetTracking = () => {
    stopTracking();
    setPosition(null);
    setTotalDistance(0);
    setPaceData([]);
    setCurrentPace(null);
    setError(null);
    lastPositionRef.current = null;
    segmentDistanceRef.current = 0;
    mockDistanceRef.current = 0;
  };

  // 手動でペースを追加（テスト用）
  const addManualPace = (seconds) => {
    const newSegment = paceData.length + 1;
    setPaceData((prev) => {
      const newArr = [
        ...prev,
        {
          segment: newSegment,
          distance: segmentLength,
          time: seconds,
          timestamp: Date.now(),
        },
      ];
      notifySegment(newArr.length, seconds);
      return newArr;
    });
    setCurrentPace(seconds);
    setTotalDistance((prev) => prev + segmentLength);
  };

  // テストモード切り替え
  const toggleTestMode = () => {
    setIsTestMode(!isTestMode);
    if (isTracking) {
      stopTracking();
    }
    resetTracking();
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mockIntervalRef.current) {
        clearTimeout(mockIntervalRef.current);
      }
    };
  }, []);

  // 平均ペースを計算
  const averagePace =
    paceData.length > 0
      ? paceData.reduce((sum, data) => sum + data.time, 0) / paceData.length
      : null;

  return {
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
    resetTracking,
    addManualPace,
    toggleTestMode,
  };
};
