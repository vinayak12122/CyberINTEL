"use client";

import Sidebar from "./component/Sidebar";
import ChatScreen from "./component/ChatScreen";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { useUI } from "./context/UIContext";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const {isMobile,isSidebarOpen,setIsSidebarOpen} = useUI();
  const {loading,user} = useAuth();
  const router = useRouter();

  // useEffect(()=>{
  //   if(!loading && !user){
  //     router.replace("/auth/login");
  //   }
  // },[user,loading])

  // if (loading || !user) return null;

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
