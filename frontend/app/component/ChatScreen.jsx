"use client"
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import { GoArrowUp, GoPlus } from "react-icons/go";
import { HiOutlineMenuAlt1 } from 'react-icons/hi';
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import useChatSession from '../hooks/useChatSession';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <div className="rounded-md overflow-hidden my-4 border border-gray-700/50 shadow-sm">
                <div className="bg-gray-800 px-4 py-1 text-xs text-gray-400 flex justify-between items-center border-b border-gray-700">
                    <span>{match[1]}</span>
                    <span>Code</span>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#1e1e1e' }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className="bg-gray-700/50 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
            </code>
        );
    },
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-700">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-white">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
    p: ({ children }) => <p className="mb- leading-7 text-gray-200">{children}</p>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">{children}</a>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-4 text-gray-400 bg-gray-800/30 py-2 pr-2 rounded-r">{children}</blockquote>,
    table: ({ children }) => <div className="overflow-x-auto my-4 border border-gray-700 rounded-lg"><table className="min-w-full divide-y divide-gray-700 text-sm">{children}</table></div>,
    thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
    th: ({ children }) => <th className="px-4 py-3 text-left font-semibold text-gray-200">{children}</th>,
    td: ({ children }) => <td className="px-4 py-2 border-t border-gray-700 text-gray-300">{children}</td>,
};


const ChatScreen = ({ sessionId, isMobile, isSidebarOpen, setIsSidebarOpen = () => { } }) => {
    const textareaRef = useRef(null);
    const bottomRef = useRef(null);

    const [isMultiline, setIsMultiline] = useState(false);
    const [text, setText] = useState("");
    const [baseHeight, setBaseHeight] = useState(0);
    const [container, setContainer] = useState(false);
    const [firstMessageSent, setFirstMessageSent] = useState(false);

    const { messages, sendMessage, stopResponse, isStreaming } = useChatSession(sessionId);
    const { user, logout } = useAuth();

    const userName = user?.name ? `Hii ${user?.name}` :
        <div className='text-center flex items-center flex-col'>
            <span className='text-xl flex gap-2 items-center'>Welcome to <p className='font-press text-lg '>CyberINTEL</p></span>
            {/* <p className='text-sm text-gray-400 pt-4'>Get <Link href={"/auth/login"} className='text-blue-700'>Auth</Link> to manage , store & use legit model chats</p> */}
        </div>;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
            setBaseHeight(textarea.scrollHeight);
            setIsMultiline(textarea.scrollHeight > 44);
        }
    }, []);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + "px";
            setIsMultiline(textarea.scrollHeight > baseHeight);
        }
    }, [text, baseHeight]);

    const handleSend = async () => {
        if (!text.trim() || isStreaming) return;
        const msg = text;
        setText("");
        if (!firstMessageSent) setFirstMessageSent(true);
        try {
            await sendMessage(msg);
        } catch (err) {
            console.error(err);
        }
    };

    const handleStop = () => {
        stopResponse();
    }

    const toastTest = () => {
        toast.info("Not available for now.")
    }

    // console.log(isStreaming)

    return (
        <div className='h-screen w-full flex flex-col'>
            <div className="w-full flex items-center justify-end border-b border-gray-700/50 p-2 mr-2">
                {isMobile && (
                    <div
                        className={`${isMobile ? "text-[18px]" : "text-[24px]"} hover:bg-gray-400/10 rounded-md my-1.5 mr-8 cursor-pointer p-2`}
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <HiOutlineMenuAlt1 />
                    </div>
                )}
                <p className="text-white font-bold flex items-start w-[70%] lg:w-[92%] md:w-[85%] sm:w-[85%] py-1 font-press text-sm">
                    CyberINTEL
                </p>
                <div className="relative flex items-center">
                    {user ? (
                        <>
                            <div
                                className="w-9 h-9 rounded-full bg-cyan-800/20 border border-gray-700
                text-white flex items-center text-lg justify-center font-semibold
                cursor-pointer mx-4"
                                title={user.email}
                                onClick={() => setContainer(prev => !prev)}
                            >
                                {user.email?.[0]?.toUpperCase()}
                            </div>

                            {container && (
                                <div className="
                    absolute top-12 right-7 
                    bg-neutral-900 text-white 
                    rounded-lg shadow-lg border border-gray-600/40
                    min-w-[140px] z-50
                ">
                                    <p className="text-sm  p-3 text-white">{user.email}</p>
                                    <button className=" p-2 bg-neutral-800/50 w-full  text-red-600 cursor-pointer text-center font-nunito font-semibold"
                                        onClick={logout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link
                            href="/auth/login"
                                className="text-center text-gray-300 px-5 py-0.5 hover:bg-gray-500/20 hover:border-gray-600/80 transition-all duration-200
            w-max rounded border border-gray-600/30 cursor-pointer"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>

            {/* Chat Section */}
            <div className='flex-1 p-2 overflow-y-auto pb-15 custom-scrollbar flex flex-col w-full items-center'>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`my-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"

                            }  ${isMobile ? "w-[99%]" : "lg:w-[60%] md:w-[80%] sm:w-[90%]"} `}
                    >
                        <div
                            className={`px-3 py-2 rounded-xl wrap-break-word overflow-hidden  ${msg.role === "user"

                                ? "bg-neutral-800/60 border border-gray-800 max-w-[75%] text-white"

                                : `max-w-[99%] text-white text-lg`
                                }`}
                        >
                            <div className="markdown-body">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={MarkdownComponents}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isStreaming && (

                    <div className={`flex justify-start ${isMobile ? "w-[99%]" : "w-[60%]"} my-2`}>

                        <div className=" flex items-center gap-1">

                            <span className="dot animate-bounce delay-0 bg-white w-2 h-2 rounded-full"></span>

                            <span className="dot animate-bounce delay-200 bg-white w-2 h-2 rounded-full"></span>

                            <span className="dot animate-bounce delay-400 bg-white w-2 h-2 rounded-full"></span>

                        </div>

                    </div>

                )}
                <div ref={bottomRef}></div>
            </div>
            {/* Input Section */}
            <div className={`px-3 pb-2 flex justify-center items-center ${messages.length < 1 && "h-full flex-col gap-10"}`}>
                {messages.length < 1 && <span className='text-2xl relative bottom-10 xl lg:text-4xl md:text-3xl sm:text-2xl capitalize'>{userName}</span>}
                <div
                    className={`flex ${isMobile ? "w-[99%]" : "lg:w-[60%] md:w-[80%] sm:w-[90%]"} 
    gap-3 rounded-2xl bg-[#1a1a1a] border border-gray-800 
    ${messages.length < 1 ? "animate-rotating-shadow" : ""}
    flex-col p-4`}
                    style={{ transition: "all .15s ease" }}
                >


                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ask your cyber doubts…"
                        className={`w-full custom-scrollbar resize-none bg-transparent text-gray-200 placeholder-gray-400 
               outline-none text-[15px] leading-relaxed `}
                        style={{
                            maxHeight: "140px",
                            overflowY: "auto",
                            transition: "height 120ms ease, padding 120ms ease",
                        }}

                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className='w-full flex justify-between items-end'>
                        <button className="shrink-0 rounded-full text-gray-400 text-2xl flex p-1 hover:bg-gray-600/20 justify-center transition-all duration-200 relative"
                            onClick={toastTest}
                        >
                            <GoPlus />
                        </button>
                        <button
                            className={`shrink-0 bg-white rounded-full text-xl flex  justify-center p-1 transition-all duration-200 relative cursor-pointer`}
                            onClick={isStreaming ? handleStop : handleSend}
                        >
                            {isStreaming ? (
                                <MdCheckBoxOutlineBlank color="red" />
                            ) : (
                                <GoArrowUp color="black" strokeWidth="1.5px" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            <p className='text-white/60 w-full text-center text-[12px] '>CyberINTEL can make mistake</p>
        </div>
    )
}

export default ChatScreen