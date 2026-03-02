"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { Toaster } from "@hexio/ui/components/sonner";
import React from "react";

export default function Page() {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <Thread />
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
