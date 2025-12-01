"use client"
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import { HiOutlineMenuAlt1 } from "react-icons/hi";
import { BiMenuAltLeft } from "react-icons/bi";
import { IoCreateOutline } from "react-icons/io5";
import { IoIosSearch } from "react-icons/io";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { useAuth } from '../context/AuthContext';


const Sidebar = ({ isMobile, isSidebarOpen, setIsSidebarOpen }) => {
    const [isClient, setIsClient] = useState(false);

    const { user } = useAuth();
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

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
  transform transition-transform duration-300
  ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                            ></div>
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
                        <div className='flex items-center gap-2 '>
                            <p className='mx-0.5'>
                                <IoCreateOutline className='text-xl' />
                            </p>
                            <p className={`whitespace-nowrap overflow-hidden transition-all duration-300  ${isSidebarOpen ? "opacity-100 " : "opacity-0 ml-0"} text-[14px]`}>New Chat</p>
                        </div>
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
                                <div className='whitespace-nowrap p-2 flex justify-between items-center gap-1
                                hover:bg-gray-500/20 border border-transparent hover:border-gray-700/40 cursor-pointer transition-all duration-300 rounded-xl'>
                                    <p className='whitespace-nowrap overflow-hidden text-ellipsis max-w-[210px]'>
                                        This is your chat history information
                                    </p>
                                    <BiDotsVerticalRounded className="text-xl h-5 w-5 opacity-60 hover:opacity-100 transition-opacity" />
                                </div>
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
                            vinayakportfolio@gmail.comhhhh</p>
                    </div>
                     }
                </div>
            }
        </>
    )
}

export default Sidebar