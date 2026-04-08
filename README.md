# DEOXYS: Trustless Bounty Escrow System

**Live Application:** [deoxys.in](https://deoxys.in)

A decentralized platform for creating, managing, and fulfilling bounties using Algorand Smart Contracts. DEOXYS ensures that funds are securely locked in escrow and only released when proof of work is validated by the creator.

## Core Value Proposition

DEOXYS eliminates the need for trust between bounty creators and workers. Unlike traditional platforms where a worker must trust the creator to pay after work is done, DEOXYS locks the reward in a dedicated smart contract address at the moment of creation. The contract logic guarantees that funds can only be released to the worker's address upon successful validation or returned to the creator if conditions are not met.

## Key Features

- **Decentralized Escrow**: Every bounty is its own Algorand Application (Smart Contract).
- **Automated State Management**: Bounties move through clear states: Open, In Progress, Submitted, and Completed.
- **Secure Payouts**: Funds are released via Inner Transactions directly from the Smart Contract to the worker.
- **Security Deposit**: Includes a small buffer (0.1 ALGO) in every contract to cover transaction fees and minimum balance requirements.
- **Platform Integrity**: A small platform fee (0.5 ALGO) is collected during bounty creation to support the ecosystem.
- **Hybrid Architecture**: Combines the speed of a FastAPI backend with the security of the Algorand blockchain.

## Technology Stack

### Frontend
- **React 18**: Current generation UI library.
- **Vite**: Ultra-fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling for a premium, responsive design.
- **Pera Wallet Connect**: Secure integration for Algorand wallet users.
- **Framer Motion**: Smooth micro-animations and transitions.
- **Lucide Icons**: Clean, consistent iconography.

### Backend
- **FastAPI**: Modern, high-performance Python web framework.
- **Algorand Python SDK**: For blockchain interaction and transaction construction.
- **Uvicorn**: Lightning-fast ASGI server.
- **Local Persistence**: JSON-based storage for off-chain metadata synchronization.

### Smart Contracts
- **PyTeal**: High-level Python language for writing Algorand Smart Contracts.
- **TEAL**: The compiled bytecode executed by the Algorand Virtual Machine (AVM).

## Project Structure

- `frontend/`: React application source code, components, and styling.
- `backend/`: FastAPI server, smart contract logic, and deployment scripts.
- `backend/bounty_escrow.py`: The PyTeal source code for the escrow logic.
- `backend/bounty_approval.teal`: Compiled approval program.

## Setup and Installation

### Backend Setup

1. Navigate to the `backend` directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn api.py:app --reload
   ```
5. Fund the Backend Wallet:
   The backend uses a demo wallet for signing certain administrative transactions. The address will be printed in the console on startup. Fund this address using the [Algorand TestNet Dispenser](https://bank.testnet.algorand.network/).

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

## Workflow

1. **Create**: A creator initiates a bounty. The system deploys a new Smart Contract and locks the reward amount plus fees.
2. **Submit**: A worker selects a bounty and submits proof of work (e.g., an IPFS hash or URL). The contract state updates to reflect the submission.
3. **Validate**: The creator reviews the submission. Upon approval, the Smart Contract executes an Inner Transaction to send the Algos to the worker.
4. **Complete**: The bounty is marked as completed on-chain and in the local metadata.

Build for the Algorand Blockchain Ecosystem.
