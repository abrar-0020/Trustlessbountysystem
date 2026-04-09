import { Wallet, ChevronDown, Copy, LogOut, ExternalLink } from "lucide-react";
import { Button } from "./Button";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { API_BASE_URL, ALGO_EXPLORER_URL } from "../utils/config";

interface NavbarProps {
  showWallet?: boolean;
}

export function Navbar({ showWallet = false }: NavbarProps) {
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { isConnected, shortAddress, address, connectWallet, disconnectWallet } = useWallet();
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    if (isConnected && address) {
        fetch(`${API_BASE_URL}/wallet/${address}`)
        .then(res => {
            if (!res.ok) throw new Error("API Offline");
            return res.json();
        })
        .then(data => {
            setBalance(data.balance.toFixed(2));
        }).catch(err => {
            console.error("Wallet fetch error:", err);
            setBalance("Offline");
        });
    }
  }, [isConnected, address]);

  const handleCopy = () => {
    if(!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-0 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={showWallet ? "/app" : "/"}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-[#1F1F1F] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm tracking-widest select-none">D</span>
          </div>
          <span className="text-[#1F1F1F] tracking-tight select-none">
            DEOXYS
          </span>
        </Link>

        {/* Right side */}
        {showWallet && isConnected ? (
          <div className="flex items-center gap-3">
            {/* Balance pill */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span className="text-sm text-[#4B4B4B]">{balance}</span>
              <span className="text-sm text-[#CFCFCF]">ALGO</span>
            </div>

            {/* Wallet button */}
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E5E5] rounded-xl hover:bg-[#F5F5F5] transition-colors text-sm text-[#1F1F1F]"
              >
                <div className="w-5 h-5 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                  <Wallet className="w-3 h-3 text-[#2563EB]" />
                </div>
                <span className="font-mono">{shortAddress}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#CFCFCF] transition-transform ${walletMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {walletMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E5E5E5] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#E5E5E5]">
                    <p className="text-xs text-[#CFCFCF] mb-1">Connected wallet</p>
                    <p className="text-sm font-mono text-[#1F1F1F]">{shortAddress}</p>
                  </div>
                  <div className="px-4 py-3 border-b border-[#E5E5E5]">
                    <p className="text-xs text-[#CFCFCF] mb-1">Balance</p>
                    <p className="text-base text-[#1F1F1F]">
                      {balance} <span className="text-[#CFCFCF]">ALGO</span>
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleCopy}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#4B4B4B] hover:bg-[#F5F5F5] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy address"}
                    </button>
                    <a
                      href={address ? `${ALGO_EXPLORER_URL}/address/${address}` : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#4B4B4B] hover:bg-[#F5F5F5] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </a>
                    <button onClick={disconnectWallet} className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : showWallet && !isConnected ? (
          <Button onClick={connectWallet} variant="primary" size="sm">
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </Button>
        ) : (
          <div className="flex items-center gap-6">
            <Link
              to="/app"
              className="text-sm text-[#4B4B4B] hover:text-[#1F1F1F] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/app/bounties"
              className="text-sm text-[#4B4B4B] hover:text-[#1F1F1F] transition-colors hidden md:block"
            >
              Browse Bounties
            </Link>
            <Button onClick={connectWallet} variant="primary" size="sm">
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
