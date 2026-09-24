# Trustless Bounty Escrow System

A bounty platform built on Algorand where the money is locked in a smart contract from the moment a bounty is created — not held by a middleman, not released on someone's word.

## Why this exists

Most bounty/freelance platforms ask you to trust that the person posting the work will actually pay once it's done. This flips that. When a bounty is created, the reward is sent straight into a dedicated Algorand smart contract. From that point on, no one — including the creator — can just walk away with the funds. The contract only releases the payout to the worker once the creator approves the submission, or refunds the creator if the bounty falls through.

## How it works

1. **Create** — a creator posts a bounty, and the backend deploys a fresh Algorand smart contract for it, locking in the reward plus a small buffer for fees.
2. **Submit** — a worker picks up the bounty and submits proof of work (an IPFS hash, a link, whatever fits). The bounty's on-chain state moves to "Submitted."
3. **Validate** — the creator checks the submission. If it's approved, the contract fires an inner transaction and pays the worker directly.
4. **Complete** — the bounty closes out, on-chain and in the local metadata store.

## Stack

**Frontend** — React 18 + Vite, Tailwind for styling, Pera Wallet Connect for wallet auth, Framer Motion for the small animations, Lucide for icons.

**Backend** — FastAPI, the Algorand Python SDK for building transactions, Uvicorn to serve it, and a simple JSON store for metadata that doesn't need to live on-chain.

**Contracts** — written in PyTeal, compiled down to TEAL for the AVM.

## A couple of design details worth knowing

- Every bounty gets its own contract, not a shared pool — keeps the logic and the funds isolated per bounty.
- Each contract holds a small buffer (0.1 ALGO) to cover its own minimum balance and fees, so payouts don't fail on dust.
- A flat 0.5 ALGO platform fee is taken at creation time.

## Project layout
frontend/ React app — components, pages, styling
backend/ FastAPI server + contract deployment logic
backend/bounty_escrow.py PyTeal source for the escrow contract
backend/bounty_approval.teal Compiled approval program


## Running it locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload
```

The backend signs some administrative transactions with a demo wallet. Its address gets printed to the console on startup — fund it from the [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/) before doing anything that needs it.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

Built for the Algorand ecosystem.
