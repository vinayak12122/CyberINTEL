const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

// console.log(BASE)
const request = async (path,options={}) =>{
    const res = await fetch(`${BASE}${path}`,{
        credentials:"include",
        headers:{
            'Content-Type':'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    if(!res.ok){
        const errorTxt = await res.text();
        throw new Error(errorTxt || "API Error");
    }

    return res.json();
}

const stream = async (path, options = {}) => {
    return fetch(`${BASE}${path}`, {
        credentials:"include",
        ...options,
    });
};

export const api = {

    guestStream: (message,controller) => stream("/guest/chat",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
        },
        body:JSON.stringify({message}),
        signal:controller.signal,
    }) ,

    createSession: () => request("/auth/chat/new-session", { method: "POST" }),

    sendMessageStream: (session_id, message, controller) => {
        return stream("/auth/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id, message }),
            signal: controller.signal,
        });
    },
    
    getHistory: (session_id) => request(`/auth/chat/${session_id}`,{
        method:"GET"
    }),
};
