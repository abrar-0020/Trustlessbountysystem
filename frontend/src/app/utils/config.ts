/**
 * Centralized API configuration for the Trustless Bounty System.
 * In development, points to localhost:8000.
 * In production (Vercel/Render), points to the VITE_API_BASE_URL env variable.
 */

const isProd = import.meta.env.PROD;

// Default to localhost if VITE_API_BASE_URL is not provided
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

console.log(`[Trustless Bounty] Using API: ${API_BASE_URL} (${isProd ? "Production" : "Development"})`);
