"use client";

import { useEffect } from "react";

export default function AttendanceHeartbeat() {
  useEffect(() => {
    let active = true;

    const sendHeartbeat = async () => {
      if (!active) return;

      try {
        await fetch("/api/attendance/heartbeat", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return null;
}