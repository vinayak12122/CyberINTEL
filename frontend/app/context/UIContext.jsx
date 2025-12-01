"use client";

import { createContext, useContext, useEffect, useState } from "react";

const UIContext = createContext(null);

export const UIProvider = ({ children }) =>{
    const [windowWidth, setWindowWidth] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (windowWidth === null) return null;

    const isMobile = windowWidth < 620;
    return(
        <UIContext.Provider
            value={{ isMobile, isSidebarOpen, setIsSidebarOpen }}
        >
            {children}
        </UIContext.Provider>
    )
}

export const useUI = () => useContext(UIContext);
