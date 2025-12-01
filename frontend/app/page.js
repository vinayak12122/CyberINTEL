"use client";

import Sidebar from "./component/Sidebar";
import ChatScreen from "./component/ChatScreen";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useUI } from "./context/UIContext";

export default function Home() {
  const {isMobile,isSidebarOpen,setIsSidebarOpen} = useUI();

  return (
    <div className="flex h-full w-full">
      <Sidebar
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <ChatScreen
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <Toaster position="top-center" />
    </div>
  );
}
