"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Listens to the global job-event stream and refreshes the current route's
// server data whenever any backup/restore/migrate job changes state — this
// is what makes scheduled (background) jobs show up live. Events are
// debounced so a burst (e.g. progress + completed) causes one refresh.
export default function LiveRefresher() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.onmessage = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => router.refresh(), 500);
    };

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      source.close();
    };
  }, [router]);

  return null;
}
