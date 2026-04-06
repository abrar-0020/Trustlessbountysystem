import { RouterProvider } from "react-router";
import { router } from "./routes";
import { WalletProvider } from "./context/WalletContext";

export default function App() {
  return (
    <WalletProvider>
      <RouterProvider router={router} />
    </WalletProvider>
  );
}