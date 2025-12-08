"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);

    const loadSessions = async () => {
        if (!user) return;
        try {
            const res = await api.getAllSessions();
            setSessions(res);
        } catch (err) {
            console.error("Failed to load sessions", err);
        }
    };

    const removeSession = (id) => {
        setSessions(prev => prev.filter(s => s.session_id !== id));
    };

    const addSession = (session) => {
        setSessions(prev => [session, ...prev]);
    };

    useEffect(() => {
        loadSessions();
    }, [user]);

    return (
        <ChatContext.Provider value={{ sessions, loadSessions, addSession, removeSession }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => useContext(ChatContext);
