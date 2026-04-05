# Trustless Bounty System - Algorand Smart Contract Backend

This directory contains the Algorand smart contract logic written in PyTeal for the Web3 Bounty Escrow system.

## Setup
1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # On Windows PowerShell: venv\Scripts\Activate.ps1
   ```
2. Install PyTeal dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Files
- `bounty_escrow.py`: The PyTeal logic that defines the smart contract behavior for the escrow system.
- `requirements.txt`: Python package dependencies.

## Contract Architecture
The contract maps to the following functions as requested:
- **create_bounty**: Triggered upon Application Creation `Txn.application_id() == Int(0)`. Sets the `creator`, `reward`, `deadline`, and `status`.
- **submit_proof**: Modifies state to add the worker's `submission` (IPFS hash) and updates status to `1` (Submitted).
- **validate_and_release**: Triggered by the creator. Unlocks and pays the worker (account 1) the Algos stored in escrow via an Inner Transaction and changes status to `2` (Completed).
- **raise_dispute**: Flagger for when conditions fail. Changes status to `3` (Disputed).

## Backend Start Command:
```bash
.\venv\Scripts\activate; uvicorn api:app --reload
```

## Frontend start command: 
```bash
npm run dev
```

## Compiling to TEAL
Execute the Python script to build the TEAL files (`bounty_approval.teal` and `bounty_clear_state.teal`):
```bash
python bounty_escrow.py
```
