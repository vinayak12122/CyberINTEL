import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import "./globals.css";
import { ChatProvider } from "./context/ChatContext";

export const metadata = {
  title: "CyberINTEL",
  description: "AI Powered Cybersecuirty Bot",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body
        className={`bg-neutral-900 text-white h-screen w-screen overflow-hidden`}
      >
        <AuthProvider>
          <UIProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
            <Toaster position="top-center" richColors />
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
