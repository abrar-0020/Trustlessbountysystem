import base64
import time
import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from algosdk.v2client import algod
from algosdk import account, mnemonic, transaction
from algosdk.logic import get_application_address

def extract_error(e: Exception) -> str:
    """Extract a human-readable message from any exception, including Algorand SDK errors."""
    # AlgodHTTPError stores the response body as e.args[0] which may be a dict or string
    args = getattr(e, "args", [])
    if args:
        first = args[0]
        if isinstance(first, dict):
            return first.get("message") or first.get("msg") or str(first)
        return str(first)
    return str(e)

app = FastAPI(title="Trustless Bounty Escrow API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TestNet config (Algonode)
ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Server Backend Wallet
# For demo purposes, we auto-generate one on startup if not provided
if os.path.exists("demo_wallet.txt"):
    with open("demo_wallet.txt", "r") as f:
        demo_mnemonic = f.read().strip()
    private_key = mnemonic.to_private_key(demo_mnemonic)
    demo_address = account.address_from_private_key(private_key)
else:
    private_key, demo_address = account.generate_account()
    demo_mnemonic = mnemonic.from_private_key(private_key)
    with open("demo_wallet.txt", "w") as f:
        f.write(demo_mnemonic)

print("="*60)
print(f"🔥 BACKEND WALLET GENERATED FOR TESTNET 🔥")
print(f"Address: {demo_address}")
print(f"Please fund this account using https://bank.testnet.algorand.network/")
print("="*60)

# ─── Platform Treasury ────────────────────────────────────────────────────────
# Platform fee = 0.5 ALGO per bounty created, sent to this treasury address.
# In production this would be a DAO-controlled multisig wallet.
# For demo, we generate (or reuse) a separate treasury wallet stored locally.
PLATFORM_FEE_ALGO = 0.5
PLATFORM_FEE_MICRO = int(PLATFORM_FEE_ALGO * 1_000_000)  # 500_000 microAlgos

if os.path.exists("treasury_wallet.txt"):
    with open("treasury_wallet.txt", "r") as f:
        treasury_mnemonic = f.read().strip()
    treasury_private_key = mnemonic.to_private_key(treasury_mnemonic)
    TREASURY_ADDRESS = account.address_from_private_key(treasury_private_key)
else:
    treasury_private_key, TREASURY_ADDRESS = account.generate_account()
    treasury_mnemonic = mnemonic.from_private_key(treasury_private_key)
    with open("treasury_wallet.txt", "w") as f:
        f.write(treasury_mnemonic)

print(f"💰 PLATFORM TREASURY ADDRESS: {TREASURY_ADDRESS}")
print(f"   Platform fee per bounty: {PLATFORM_FEE_ALGO} ALGO")
print("="*60)

DB_FILE = "bounties.json"

def load_bounties():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_bounties(db_list):
    with open(DB_FILE, "w") as f:
        json.dump(db_list, f, indent=2)

bounties_db = load_bounties()

class BountyRequest(BaseModel):
    title: str
    description: str
    reward_algo: float
    deadline_timestamp: int
    requirements: list[str]

class ProofSubmission(BaseModel):
    ipfs_hash: str
    worker_address: Optional[str] = None

def wait_for_confirmation(client, txid):
    last_round = client.status().get('last-round')
    txinfo = client.pending_transaction_info(txid)
    while not (txinfo.get('confirmed-round') and txinfo.get('confirmed-round') > 0):
        time.sleep(1)
        txinfo = client.pending_transaction_info(txid)
    return txinfo

def compile_program(source_code):
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

@app.get("/")
def read_root():
    return {"message": "Trustless Web3 API Running"}

@app.post("/bounties/create")
def create_bounty(bounty: BountyRequest):
    try:
        with open("bounty_approval.teal", "r") as f:
            approval_source = f.read()
        with open("bounty_clear_state.teal", "r") as f:
            clear_source = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Teal files missing.")

    try:
        approval_program = compile_program(approval_source)
        clear_program = compile_program(clear_source)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Contract compilation failed: {e}")

    global_schema = transaction.StateSchema(num_uints=3, num_byte_slices=2)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    sp = client.suggested_params()
    
    # 1 Algo = 1,000,000 microAlgos
    reward_micro = int(bounty.reward_algo * 1000000)
    app_args = [
        reward_micro.to_bytes(8, "big"),
        bounty.deadline_timestamp.to_bytes(8, "big")
    ]
    
    txn = transaction.ApplicationCreateTxn(
        sender=demo_address,
        sp=sp,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args,
    )
    
    try:
        signed_txn = txn.sign(private_key)
        tx_id = client.send_transaction(signed_txn)
        confirmed_txn = wait_for_confirmation(client, tx_id)
        app_id = confirmed_txn["application-index"]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tx failed (Account Funded?): {extract_error(e)}")

    try:
        escrow_address = get_application_address(app_id)
        sp_fund = client.suggested_params()
        
        # Tx 1: Fund escrow with the full reward + min balance buffer
        fund_txn = transaction.PaymentTxn(
            demo_address, sp_fund, escrow_address, reward_micro + 100000
        )
        
        # Tx 2: Collect platform fee → Treasury wallet
        platform_fee_txn = transaction.PaymentTxn(
            demo_address, sp_fund, TREASURY_ADDRESS, PLATFORM_FEE_MICRO,
            note=b"Deoxys Platform Fee"
        )
        
        # Group and send both atomically
        gid = transaction.calculate_group_id([fund_txn, platform_fee_txn])
        fund_txn.group = gid
        platform_fee_txn.group = gid
        
        signed_fund = fund_txn.sign(private_key)
        signed_fee = platform_fee_txn.sign(private_key)
        client.send_transactions([signed_fund, signed_fee])
        print(f"✅ Escrow funded + {PLATFORM_FEE_ALGO} ALGO platform fee sent to treasury")
    except Exception as e:
        print(f"Warning: Escrow funding failed {e}")

    bounty_id = len(bounties_db) + 1
    new_bounty = {
        "id": bounty_id,
        "title": bounty.title,
        "description": bounty.description,
        "reward": str(bounty.reward_algo),
        "deadline_str": "Ending soon",
        "requirements": bounty.requirements,
        "status": "open",
        "category": "Development",
        "app_id": app_id,
        "tx_id": tx_id,
        "contract_address": escrow_address,
        "platform_fee": PLATFORM_FEE_ALGO
    }
    bounties_db.append(new_bounty)
    save_bounties(bounties_db)
    return {"status": "success", "bounty": new_bounty}

@app.get("/bounties")
def get_bounties():
    return bounties_db

@app.get("/wallet")
def get_wallet_info():
    try:
        account_info = client.account_info(demo_address)
        # Convert microAlgos to ALGO
        algo_balance = account_info.get("amount", 0) / 1000000.0
    except Exception as e:
        print(f"Failed to fetch account info: {e}")
        algo_balance = 0.0

    return {
        "address": demo_address,
        "treasury": TREASURY_ADDRESS,
        "balance": algo_balance,
        "platform_fee": PLATFORM_FEE_ALGO,
        "completedBounties": len([b for b in bounties_db if b.get("status") == "completed"]),
        "successRate": 100,
        "totalEarned": sum(float(b.get("reward", 0)) for b in bounties_db if b.get("status") == "completed")
    }

@app.get("/bounties/{bounty_id}")
def get_bounty(bounty_id: int):
    for b in bounties_db:
        if b["id"] == bounty_id:
            return b
    raise HTTPException(status_code=404, detail="Not found")

@app.post("/bounties/{bounty_id}/submit_proof")
def submit_proof(bounty_id: int, proof: ProofSubmission):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if b["id"] == bounty_id), None)
    if bounty_idx is None:
        raise HTTPException(status_code=404)
        
    bounty = bounties_db[bounty_idx]
    app_id = bounty["app_id"]
    sp = client.suggested_params()
    app_args = [b"submit_proof", proof.ipfs_hash.encode()]
    
    txn = transaction.ApplicationCallTxn(
        sender=demo_address,
        sp=sp,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=app_args
    )
    
    try:
        signed = txn.sign(private_key)
        tx_id = client.send_transaction(signed)
        wait_for_confirmation(client, tx_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=extract_error(e))
        
    bounties_db[bounty_idx]["status"] = "in_progress"
    bounties_db[bounty_idx]["proof"] = proof.ipfs_hash
    # Only store worker address if it looks like a valid Algorand address (58 chars)
    worker = proof.worker_address
    if worker and len(worker) == 58:
        bounties_db[bounty_idx]["worker"] = worker
    else:
        bounties_db[bounty_idx]["worker"] = demo_address
    save_bounties(bounties_db)
    return {"status": "success", "message": "Proof submitted on-chain", "txid": tx_id, "bounty": bounties_db[bounty_idx]}

@app.post("/bounties/{bounty_id}/validate")
def validate_bounty(bounty_id: int):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if b["id"] == bounty_id), None)
    if bounty_idx is None:
         raise HTTPException(status_code=404)
    
    bounty = bounties_db[bounty_idx]
    app_id = bounty["app_id"]
    # Validate the worker address — must be a real 58-char Algorand address
    worker_addr = bounty.get("worker", demo_address)
    if not worker_addr or len(worker_addr) != 58:
        worker_addr = demo_address
    sp = client.suggested_params()
    sp.fee = sp.min_fee * 2 
    
    app_args = [b"validate_and_release"]
    
    txn = transaction.ApplicationCallTxn(
        sender=demo_address,
        sp=sp,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=app_args,
        accounts=[worker_addr]
    )
    
    try:
        signed = txn.sign(private_key)
        tx_id = client.send_transaction(signed)
        wait_for_confirmation(client, tx_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=extract_error(e))
        
    bounties_db[bounty_idx]["status"] = "completed"
    save_bounties(bounties_db)
    return {"status": "success", "message": "Bounty validated and funds released", "txid": tx_id, "bounty": bounty}

@app.post("/bounties/{bounty_id}/dispute")
def dispute_bounty(bounty_id: int):
    bounty = next((b for b in bounties_db if b["id"] == bounty_id), None)
    if not bounty:
         raise HTTPException(status_code=404)
    
    app_id = bounty["app_id"]
    sp = client.suggested_params()
    app_args = [b"raise_dispute"]
    
    txn = transaction.ApplicationCallTxn(
        sender=demo_address,
        sp=sp,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=app_args
    )
    
    try:
        signed = txn.sign(private_key)
        tx_id = client.send_transaction(signed)
        wait_for_confirmation(client, tx_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=extract_error(e))
        
    bounty["status"] = "disputed"
    return {"message": "Bounty disputed", "tx_id": tx_id, "bounty": bounty}
