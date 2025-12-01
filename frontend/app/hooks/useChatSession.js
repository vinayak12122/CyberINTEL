"use client";
import React, { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api';
import { toast } from 'sonner'
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { parseLLMChunk } from '../utils/parseLLM';

const useChatSession = (initialSessionId) => {

    const router = useRouter();
    const {user,loading:authLoading} = useAuth();

    const [sessionId, setSessionId] = useState(initialSessionId);
    const [messages, setMessages] = useState([]);
    const abortRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);


    useEffect(()=>{
        if(authLoading) return;
        if(!user) return;
        if(!initialSessionId) return;

        const loadHistory = async() =>{
            try {
                const res = await api.getHistory(initialSessionId);
                setMessages(res.map(msg => ({
                    role:msg.role,
                    content:msg.content
                })))
            } catch (error) {
                console.log("No history found yet");
            }
        };
        loadHistory();
    },[initialSessionId,user,authLoading]);

    
    const sendMessage = async (text) => {
        if (!text) return;

        setMessages((prev) => [...prev,{role:"user",content:text},{role:"ai",content:""}]);

        if(!user && !authLoading){
            return streamGuest(text);
        }

        let activeSession = sessionId;

        if (!activeSession) {
            try {
                const res = await api.createSession();
                activeSession = res.session_id;
                setSessionId(activeSession);

                // SILENTLY update URL without remount
                if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", `/${activeSession}`);
                }

            } catch (err) {
                console.error("Failed to create session:", err);
                return;
            }
        }

        return streamAuth(activeSession,text);
    };

    const streamGuest = async(text) =>{
        const controller = new AbortController();
        abortRef.current = controller;

        setIsStreaming(true);

        try {
            const res = await api.guestStream(text,controller);
            await parseStream(res);
        } catch (err) {
            if (err.name !== "AbortError") console.error("Guest stream error:", err);
        }finally{
            abortRef.current = null;
            setIsStreaming(false);
        }
    }

    const streamAuth = async(sessionId,text)=>{
        const controller = new AbortController();
        abortRef.current = controller;
        setIsStreaming(true);

        try {
            const res = await api.sendMessageStream(sessionId,text,controller);
            await parseStream(res);
        } catch (err) {
            if (err.name !== "AbortError") console.error("Guest stream error:", err);
        }finally{
            abortRef.current = null;
            setIsStreaming(false)
        }
    }

    const parseStream = async(res) =>{
        const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

        let buffer = "";
        let streamed = "";

        while(true){
            const {done,value} = await reader.read();
            if(done) break;

            buffer += value
            console.log(buffer)

            while(buffer.includes("\n\n")){
                const [full,rest] = buffer.split("\n\n",2);
                buffer = rest;
                
                if(full.startsWith("data:")){
                    const chunk = full.replace("data:","");
                    const parsed = parseLLMChunk(chunk);

                    streamed += parsed;

                    setMessages((prev) => {
                        const copy = [...prev];
                        copy[copy.length - 1].content = streamed;
                        return copy;
                    })
                }
            }
        }
    };


    
    const stopResponse = () => {
        abortRef.current?.abort();
    }

    return {
        sessionId,
        messages,
        sendMessage,
        stopResponse,
        isStreaming
    };
}

export default useChatSession