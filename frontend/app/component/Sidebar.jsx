"use client"
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import { BiMenuAltLeft } from "react-icons/bi";
import { IoCreateOutline } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import useChatSession from '../hooks/useChatSession';
import { api } from '../lib/api';
import DropDown from '../utils/DropDown';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useChatContext } from '../context/ChatContext';


const Sidebar = ({ isMobile, isSidebarOpen, setIsSidebarOpen }) => {

    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    const { sessionId } = useChatSession();
    const { sessions, setSessions, loadSessions } = useChatContext();

    const [dropdown, setDropdown] = useState({
        open: false,
        x: 0,
        y: 0,
        direction: "down",
        sessionId: null
    });

    const openMenu = (e,id)=>{
        const rect = e.currentTarget.getBoundingClientRect();        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdown({
            open: true,
            x: rect.left,
            y: spaceBelow > 120 ? rect.bottom : rect.top,   
            direction: spaceBelow > 120 ? "down" : "up",
            sessionId: id
        })
    }

    const { user } = useAuth();
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (user) loadSessions();
    }, [user]);


    if (!isClient) return null;

    const handleDlete = async(id) => {
        try {
            await api.deleteSession(id);
            setSessions(prev => prev.filter(s =>s.session_id !== id));
            router.push("/");
        } catch (error) {
            toast.error(error);
        }
    }

    return (
        <>
            {isMobile ?
                (<>
                    {isClient && isMobile && createPortal(
                        <>
                            <div
                                className={`fixed inset-0 bg-black/40 transition-opacity duration-300
  ${isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                                onClick={() => setIsSidebarOpen(false)}
                            />

                            <div
                                className={`fixed top-0 left-0 h-full w-64 bg-neutral-900 shadow-xl
  transform transition-transform duration-300 flex flex-col
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                            >

                                <div className='p-2 mx-2 mt-2 hover:bg-gray-500/20 cursor-pointer rounded-xl duration-200 w-max border border-transparent hover:border-gray-600/80'
                                    onClick={() => setIsSidebarOpen(prev => !prev)}
                                >
                                    <HiOutlineMenuAlt1 className='text-2xl'
                                    />
                                </div>
                                <div className='features mt-5 flex flex-col font-semibold '>
                                    <Link href={'/'} className='link-feature flex items-center gap-2 '>
                                        <p className='mx-0.5'>
                                            <IoCreateOutline className='text-xl' />
                                        </p>
                                        <p className={`whitespace-nowrap overflow-hidden transition-all duration-300  ${isSidebarOpen ? "opacity-100 " : "opacity-0 ml-0"} text-[14px]`}>New Chat</p>
                                    </Link>
                                    <div className='flex items-center gap-2'>
                                        <p className='mx-0.5'>
                                            <IoIosSearch className='text-xl' />
                                        </p>
                                        <p className={`whitespace-nowrap overflow-hidden transition-all duration-300  ${isSidebarOpen ? "opacity-100 " : "opacity-0 ml-0"} text-[14px]`}>Search chat</p>
                                    </div>
                                </div>
                                {isSidebarOpen &&
                                    <div className={`flex-1 mt-2 mx-2 whitespace-nowrap ${isSidebarOpen ? "opacity-100 " : "opacity-0 "} transition-all duration-300 `}>
                                        <p className='text-white/60 text-sm p-2'>Your Chats</p>
                                        <div className='overflow-y-auto overflow-x-hidden'>
                                            {sessions.map((s) => (
                                                <div
                                                    key={s.session_id}
                                                    className="flex items-center justify-between rounded-xl 
             hover:bg-gray-500/20 border border-transparent 
             hover:border-gray-700/40 transition-all p-1 px-2"
                                                >
                                                    <Link href={`/${s.session_id}`} className="flex-1 overflow-hidden">
                                                        <p className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[210px]">
                                                            {s.title || "Untitled Chat"}
                                                        </p>
                                                    </Link>
                                                    <BsThreeDotsVertical className='p-1 w-6 h-6 hover:bg-gray-600/50 rounded-md border border-transparent hover:border-gray-500 '
                                                    onClick={(e)=>openMenu(e,s.session_id)}
                                                    />   
                                                    {dropdown.open &&
                                                        createPortal(
                                                            <DropDown
                                                                x={dropdown.x}
                                                                y={dropdown.y}
                                                                direction={dropdown.direction}
                                                                sessionId={dropdown.sessionId}
                                                                close={() => setDropdown({ open: false })}
                                                                onDelete={handleDlete}
                                                            />,
                                                            document.body
                                                        )
                                                    }
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                }
                                {user &&
                                    <div className='m-2 border-t border-gray-700/40 mt-auto flex items-center p-2'>
                                        <div
                                            className="w-9 h-9 shrink-0 rounded-full bg-cyan-800/20 border border-gray-700
        text-white flex items-center justify-center text-lg font-semibold cursor-pointer relative right-2"
                                            title={user.email}
                                        >
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <p className={`transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis
        ${isSidebarOpen ? "opacity-100 w-[200px]" : "opacity-0 w-0"}`}>
                                            {user.name}
                                        </p>
                                    </div>
                                }
                            </div>
                        </>,
                        document.body
                    )}
                </>
                ) :
                <div className={`${isSidebarOpen ? "w-[300px]" : "w-14"} h-screen bg-transparent border-r border-gray-700/40 duration-300 transition-all flex flex-col`}>
                    <div className='p-2 mx-2 mt-2 hover:bg-gray-500/20 cursor-pointer rounded-xl duration-200 w-max border border-transparent hover:border-gray-600/80'
                        onClick={() => setIsSidebarOpen(prev => !prev)}
                    >
                        <BiMenuAltLeft className='text-2xl'
                        />
                    </div>
                    <div className='features mt-5 flex flex-col font-semibold '>
                        <Link href={'/'} className='link-feature flex items-center gap-2 '>
                            <p className='mx-0.5'>
                                <IoCreateOutline className='text-xl' />
                            </p>
                            <p className={`whitespace-nowrap overflow-hidden transition-all duration-300  ${isSidebarOpen ? "opacity-100 " : "opacity-0 ml-0"} text-[14px]`}>New Chat</p>
                        </Link>
                        <div className='flex items-center gap-2'>
                            <p className='mx-0.5'>
                                <IoIosSearch className='text-xl' />
                            </p>
                            <p className={`whitespace-nowrap overflow-hidden transition-all duration-300  ${isSidebarOpen ? "opacity-100 " : "opacity-0 ml-0"} text-[14px]`}>Search chat</p>
                        </div>
                    </div>
                    {isSidebarOpen &&
                        <div className={`flex-1 mt-2 mx-2 whitespace-nowrap ${isSidebarOpen ? "opacity-100 " : "opacity-0 "} transition-all duration-300 `}>
                            <p className='text-white/60 text-sm p-2'>Your Chats</p>
                            <div className='overflow-y-auto overflow-x-hidden'>
                                {sessions.map((s) => (
                                    <div
                                        key={s.session_id}
                                        className="flex items-center justify-between rounded-xl 
             hover:bg-gray-500/20 border border-transparent 
             hover:border-gray-700/40 transition-all p-1 px-2"
                                    >
                                        {/* Chat Title */}
                                        <Link href={`/${s.session_id}`} className="flex-1 overflow-hidden">
                                            <p className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[210px]">
                                                {s.title || "Untitled Chat"}
                                            </p>
                                        </Link>
                                        <BsThreeDotsVertical className='p-1 w-6 h-6 hover:bg-gray-600/50 rounded-md border border-transparent hover:border-gray-500 '
                                            onClick={(e) => openMenu(e, s.session_id)}
                                        />
                                        {dropdown.open &&
                                            createPortal(
                                                <DropDown
                                                    x={dropdown.x}
                                                    y={dropdown.y}
                                                    direction={dropdown.direction}
                                                    sessionId={dropdown.sessionId}
                                                    close={() => setDropdown({ open: false })}
                                                    onDelete={handleDlete}
                                                />,
                                                document.body
                                            )
                                        }
                                    </div>
                                ))}

                            </div>
                        </div>
                    }
                    {user &&
                        <div className='m-2 border-t border-gray-700/40 mt-auto flex items-center p-2'>
                            <div
                                className="w-9 h-9 shrink-0 rounded-full bg-cyan-800/20 border border-gray-700
        text-white flex items-center justify-center text-lg font-semibold cursor-pointer relative right-2"
                                title={user.email}
                            >
                                {user.email?.[0]?.toUpperCase()}
                            </div>
                            <p className={`transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis
        ${isSidebarOpen ? "opacity-100 w-[200px]" : "opacity-0 w-0"}`}>
                                {user.email}
                            </p>
                        </div>
                    }
                </div>
            }
        </>
    )
}

export default Sidebar