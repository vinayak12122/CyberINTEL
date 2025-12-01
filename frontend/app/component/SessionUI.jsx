"use client";

import Sidebar from "./Sidebar";
import ChatScreen from "./ChatScreen";
import { useUI } from "../context/UIContext";

export default function SessionUI({ sessionId }) {
    const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUI();

    return (
        <div className="flex h-full w-full">
            <Sidebar
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <ChatScreen
                sessionId={sessionId}
                isMobile={isMobile}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
        </div>
    );
}
