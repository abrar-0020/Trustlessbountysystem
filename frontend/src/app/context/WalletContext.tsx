import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { toast } from "sonner";

interface WalletContextType {
  address: string | null;
  shortAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  peraWallet: PeraWalletConnect | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize outside so it's a singleton pattern across renders if needed
const peraWallet = new PeraWalletConnect({
    shouldShowSignTxnToast: false
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        // Setup the disconnect event listener
        peraWallet.connector?.on("disconnect", disconnectWallet);

        if (accounts.length) {
          setAddress(accounts[0]);
        }
      })
      .catch((e) => console.log(e));
  }, []);

  const connectWallet = async () => {
    try {
      const newAccounts = await peraWallet.connect();
      if (newAccounts.length) {
        setAddress(newAccounts[0]);
      }
      
      // Setup the disconnect event listener
      peraWallet.connector?.on("disconnect", disconnectWallet);
    } catch (e) {
      if (e?.name === "PeraWalletSignTxnError") {
         toast.error("User cancelled the flow");
      }
      console.log(e);
    }
  };

  const disconnectWallet = () => {
    peraWallet.disconnect();
    setAddress(null);
  };

  const shortAddress = address
    ? `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
    : null;

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress,
        isConnected: !!address,
        connectWallet,
        disconnectWallet,
        peraWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    raiseError("useWallet must be used within a WalletProvider");
  }
  return context as WalletContextType;
}

function raiseError(arg0: string) {
    throw new Error(arg0);
}
