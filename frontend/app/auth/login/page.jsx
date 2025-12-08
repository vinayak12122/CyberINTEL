'use client'
import Loader from '@/app/component/Loader';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import { GoArrowLeft } from 'react-icons/go';
import { toast } from 'sonner';

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { login, googleLogin, loginLoading ,user,loading} = useAuth();

  useEffect(()=>{
    if(!loading && user){
      router.replace('/')
    }
  },[user,loading])

  const handleSubmit = async(e) => {
    e.preventDefault();
    await login(email,password)
  }
  return (
    <div className='bg-neutral-900 h-screen flex items-center justify-center w-full text-white'>
      <Link href={'/'} className='fixed top-5 left-5 lg:text-2xl text-xl '>
        <GoArrowLeft />
      </Link>
      <div className='w-full flex flex-col justify-center items-center'>
        {/* <span className='font-press text-3xl pb-6'>CyberINTEL</span> */}
        <p className='w-[70%] font-bold text-center text-white text-xl pb-1'>Welcome to <span className='font-press text-white'>CyberINTEL</span></p>
        <p className='w-[70%] text-center text-sm text-gray-500 pb-10'>Log in to start chatting</p>
        <form onSubmit={handleSubmit} className='w-[80%] lg:w-[30%] justify-center items-center flex flex-col gap-4'>
          <input 
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email" 
          placeholder='Enter your email' 
          className='border border-gray-700/40 outline-none rounded p-2 w-full placeholder:font-bold placeholder:text-neutral-600/50' />
          <input 
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          type="password" 
          placeholder='Enter your password' 
          className='border border-gray-700/40 outline-none rounded p-2 w-full placeholder:font-bold placeholder:text-neutral-600/50' />
          <button type='submit' className='w-full bg-gray-900/40 border border-gray-700/40  rounded p-2 font-bold font-raleway cursor-pointer'>
            {loginLoading ? <Loader/> : "Continue"}
          </button>
        </form>
        <p className='border-b border-gray-700 w-[70%] lg:w-[32%] p-4'></p>
        <div className='w-[80%] lg:w-[30%] text-xl text-center flex items-center gap-4 justify-center mt-8 bg-gray-900/40 border border-gray-700/40 p-2 rounded mb-4 cursor-pointer'
        onClick={googleLogin}
        >
          <FcGoogle className='' />
          <p className=' text-[16px]'>Continue with google</p>
        </div>
        <p className='text-sm font-semibold font-raleway'>Don't have an account? <Link href='/auth/signup' className='text-blue-600 font-medium'>SignUp</Link></p>
      </div>
    </div>
  )
}

export default Login