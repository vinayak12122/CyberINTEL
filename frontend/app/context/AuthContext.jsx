"use client";
import { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/auth/me`, {
                credentials: "include"
            });

            if (!res.ok) {
                setUser(null);
                setLoading(false);
                return;
            }

            const data = await res.json();
            setUser(data);
        } catch (error) {
            setUser(null);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!user) fetchUser();
    }, []);

    const login = async (email, password) => {
        if (!email || !password) {
            toast.error("Please fill all required fields");
            return false;
        }

        setLoginLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(Array.isArray(err.detail)
                    ? err.detail[0]?.msg || "Login failed"
                    : err.detail || "Login failed");
                setLoginLoading(false);
                return false
            }

            await fetchUser();
            // console.log(user?.email)
            // toast.success(`Welcome ${user?.email}`)
            window.location.href = "/";
            return true;
        } catch (err) {
            toast.error("Login Error", err.message)
            setLoginLoading(false);
        }
    }

    const logout = async () => {
        await fetch(`${BACKEND_URL}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });
        setUser(null);
        window.location.href = "/"
    };

    // useEffect(() => {
    //     if (!window.google) return;
    //     if (window.__google_initialized) return;

    //     window.__google_initialized = true;
    // }, []);

    const googleLogin = () => {
        window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            ux_mode: "popup",
            callback: async (res) => {
                const code = res.code;  
                if (!code) {
                    toast.error("Google login failed");
                    return;
                }

                try {
                    const r = await fetch(`${BACKEND_URL}/auth/google`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }),  
                        credentials: "include"
                    });

                    if (!r.ok) {
                        const err = await r.json().catch(() => ({}));
                        toast.error(Array.isArray(err.detail)
                            ? err.detail[0]?.msg || "Google login error"
                            : err.detail || "Google login error");
                        return;
                    }

                    await fetchUser();
                    window.location.href = "/";
                } catch (error) {
                    toast.error("Request failed");
                }
            }
        }).requestCode();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                googleLogin,
                loginLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);