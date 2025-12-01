'use client'
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { FcGoogle } from "react-icons/fc";
import { GoArrowLeft } from 'react-icons/go';
import { toast } from 'sonner';

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const {googleLogin} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!name || !email || !password){
            toast.error("Please enter the fields.")
            return ;
        }
        try {
            const res = await fetch(`${BACKEND_URL}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name,email, password }),
                credentials: "include"
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(Array.isArray(data.detail) ? data.detail[0]?.msg || "SignUp Failed" : data.detail || "SignUp Failed");
                return;
            }
            toast.success("Signup success. Go login.");
            window.location.href = "/auth/login"
        } catch {
            toast.error("Registered Aleady");
        }
    };

    return (
        <div className='bg-neutral-900 h-screen flex items-center justify-center w-full text-white'>
            <Link href={'/'} className='fixed top-5 left-5 lg:text-2xl text-xl '>
                <GoArrowLeft />
            </Link>

            <div className='w-full flex flex-col justify-center items-center'>
                <p className='w-[70%] font-bold text-center text-2xl pb-1 text-white'>
                    Create your Account
                </p>
                <p className='w-[70%] text-center text-sm text-gray-500 pb-10'>
                    Get register to start your first chat
                </p>

                <form onSubmit={handleSubmit}
                    className='w-[70%] lg:w-[30%] justify-center items-center flex flex-col gap-4'>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        type="text"
                        placeholder='Enter your name'
                        className='border border-gray-700/40 capitalize outline-none rounded p-2 w-full placeholder:font-bold placeholder:text-neutral-600/50'
                    />
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder='Enter your email'
                        className='border border-gray-700/40 outline-none rounded p-2 w-full placeholder:font-bold placeholder:text-neutral-600/50'
                    />
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder='Enter your password'
                        className='border border-gray-700/40 outline-none rounded p-2 w-full placeholder:font-bold placeholder:text-neutral-600/50'
                    />
                    <button type='submit'
                        className='w-full bg-gray-900/40 border border-gray-700/40  rounded p-2 font-bold font-raleway cursor-pointer'>
                        Register
                    </button>
                </form>

                <p className='border-b border-gray-700 w-[70%] lg:w-[32%] p-4'></p>

                <div className='w-[70%] lg:w-[30%] text-xl text-center flex items-center gap-4 justify-center mt-8 bg-gray-900/40 border border-gray-700/40 p-2 rounded mb-4 cursor-pointer'
                onClick={googleLogin}
                >
                    <FcGoogle className='' />
                    <p className=' text-[16px]'>Continue with google</p>
                </div>

                <p className='text-sm font-semibold font-raleway'>
                    Already have an account? <Link href='/auth/login' className='text-blue-600 font-medium'>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
