"use client";
import React, { useEffect, useRef } from "react";

const DropDown = ({ x, y, direction, sessionId, close,onDelete }) => {

    const dropRef = useRef(null);

    useEffect(()=>{
        const handleClickOutside = (e) => {
            if(dropRef.current && !dropRef.current.contains(e.target)){
                close();
            }
        };

        const handleScroll = () => close();

        document.addEventListener("mousedown",handleClickOutside);
        window.addEventListener("scroll",handleScroll,true);
        return ()=>{
            document.removeEventListener("mousedown",handleClickOutside);
            window.removeEventListener("scroll",handleScroll);
        };
    },[]);
    return (
        <div
        ref={dropRef}
            style={{
                position: "fixed",
                top: direction === "down" ? y + 4 : y - 40,
                left: x ,
                zIndex: 9999
            }}
            className="w-max bg-neutral-800 shadow-xl rounded-lg border border-gray-700 "
        >
            <p
                className="p-1 px-2 rounded hover:bg-neutral-700 cursor-pointer"
                onClick={() => {
                    onDelete(sessionId)
                    close();
                }}
            >
                Delete
            </p>
        </div>
    );
};

export default DropDown;
