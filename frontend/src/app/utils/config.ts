/**
 * Centralized API configuration for the Trustless Bounty System.
 * In development, points to localhost:8000.
 * In production (Vercel/Render), points to the VITE_API_BASE_URL env variable.
 */

const isProd = import.meta.env.PROD;

// Default to localhost if VITE_API_BASE_URL is not provided
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Algorand Network Configuration
const NETWORK = import.meta.env.VITE_ALGO_NETWORK || "testnet";
export const ALGO_NETWORK = NETWORK;

export const ALGOD_SERVER = import.meta.env.VITE_ALGO_NETWORK_URL || 
  (NETWORK === "mainnet" 
    ? "https://mainnet-api.algonode.cloud" 
    : "https://testnet-api.algonode.cloud");

export const ALGO_EXPLORER_URL = NETWORK === "mainnet"
  ? "https://explorer.perawallet.app"
  : "https://lora.algokit.io/testnet";

console.log(`[Trustless Bounty] Using API: ${API_BASE_URL} (${isProd ? "Production" : "Development"})`);
console.log(`[Trustless Bounty] Network: ${NETWORK} | Node: ${ALGOD_SERVER}`);
