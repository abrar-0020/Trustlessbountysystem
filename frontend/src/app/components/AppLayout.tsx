import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F5]">
      <Navbar showWallet />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E5E5",
            color: "#1F1F1F",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            borderRadius: "14px",
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
}
