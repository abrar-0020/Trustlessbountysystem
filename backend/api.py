import base64
import time
import os
import json
import hashlib
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from algosdk.v2client import algod
from algosdk import transaction

def extract_error(e: Exception) -> str:
    """Extract a human-readable message from any exception, including Algorand SDK errors."""
    args = getattr(e, "args", [])
    if args:
        first = args[0]
        if isinstance(first, dict):
            return first.get("message") or first.get("msg") or str(first)
        return str(first)
    return str(e)

def safe_b64decode(s: str) -> bytes:
    """Decode a base64 string, adding padding if needed (Pera Wallet omits trailing '=')."""
    s = s.strip()
    missing = len(s) % 4
    if missing:
        s += '=' * (4 - missing)
    return base64.b64decode(s)

app = FastAPI(title="Trustless Bounty Escrow API - Web3 Stateless")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

DB_PATH = os.getenv("DB_PATH", "bounties.json")

def load_bounties():
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_bounties(db_list):
    with open(DB_PATH, "w") as f:
        json.dump(db_list, f, indent=2)

bounties_db = load_bounties()

# Models
class BountyRequest(BaseModel):
    title: str
    description: str
    reward_algo: float
    deadline_timestamp: int
    requirements: list[str]
    expected_output: Optional[str] = None
    creator_address: str
    app_id: int
    tx_id: str

class ProofSubmission(BaseModel):
    work_link: str
    output: Optional[str] = None
    worker_address: str
    tx_id: str  # Frontend already broadcast; we just store the txid

class ActionRequest(BaseModel):
    tx_id: str
    resolution: Optional[str] = None  # for resolve_dispute ("approve" or "reject")
    user_address: str


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

@app.get("/teal")
def get_teal():
    try:
        with open("bounty_approval.teal", "r") as f:
            approval_source = f.read()
        with open("bounty_clear_state.teal", "r") as f:
            clear_source = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Teal files missing.")

    try:
        approval_compiled = compile_program(approval_source)
        clear_compiled = compile_program(clear_source)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Contract compilation failed: {e}")

    return {
        "approval": base64.b64encode(approval_compiled).decode('utf-8'),
        "clear": base64.b64encode(clear_compiled).decode('utf-8')
    }

@app.post("/bounties/create")
def create_bounty(payload: BountyRequest):
    # Transaction already broadcast from frontend; just record metadata
    expected_hash = None
    validation_type = "manual"
    if payload.expected_output:
        expected_hash = hashlib.sha256(payload.expected_output.encode("utf-8")).hexdigest()
        validation_type = "auto"

    bounty_id = len(bounties_db) + 1
    new_bounty = {
        "id": bounty_id,
        "title": payload.title,
        "description": payload.description,
        "reward": str(payload.reward_algo),
        "deadline_str": "Ending soon",
        "requirements": payload.requirements,
        "status": "open",
        "category": "Development",
        "app_id": payload.app_id,
        "tx_id": payload.tx_id,
        "creator_address": payload.creator_address,
        "expected_hash": expected_hash,
        "validation_type": validation_type
    }
    bounties_db.append(new_bounty)
    save_bounties(bounties_db)
    return {"status": "success", "bounty": new_bounty}

@app.get("/bounties")
def get_bounties():
    return bounties_db

@app.get("/bounties/{bounty_id}")
def get_bounty(bounty_id: str):
    for b in bounties_db:
        if str(b.get("id")) == str(bounty_id):
            return b
    raise HTTPException(status_code=404, detail="Not found")

@app.post("/bounties/{bounty_id}/submit_proof")
def submit_proof(bounty_id: str, payload: ProofSubmission):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if str(b.get("id")) == str(bounty_id)), None)
    if bounty_idx is None:
        raise HTTPException(status_code=404)
        
    # Tx already broadcast from frontend — just store metadata
    bounties_db[bounty_idx]["status"] = "in_progress"
    bounties_db[bounty_idx]["submission_link"] = payload.work_link
    bounties_db[bounty_idx]["worker"] = payload.worker_address
    
    validation_type = bounties_db[bounty_idx].get("validation_type", "manual")
    if validation_type == "auto" and payload.output:
        bounties_db[bounty_idx]["submission_output"] = payload.output
        bounties_db[bounty_idx]["submission_hash"] = hashlib.sha256(
            payload.output.strip().encode("utf-8")
        ).hexdigest()
        
    save_bounties(bounties_db)
    return {"status": "success", "message": "Proof recorded", "txid": payload.tx_id, "bounty": bounties_db[bounty_idx]}

@app.post("/bounties/{bounty_id}/validate")
def validate_bounty(bounty_id: str, payload: ActionRequest):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if str(b.get("id")) == str(bounty_id)), None)
    if bounty_idx is None:
         raise HTTPException(status_code=404)
    
    # Tx already broadcast from frontend
    if payload.user_address != bounties_db[bounty_idx].get("creator_address"):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    bounties_db[bounty_idx]["status"] = "completed"
    save_bounties(bounties_db)
    return {"status": "success", "message": "Bounty validated and funds released", "txid": payload.tx_id, "bounty": bounties_db[bounty_idx]}

@app.post("/bounties/{bounty_id}/dispute")
def dispute_bounty(bounty_id: str, payload: ActionRequest):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if str(b.get("id")) == str(bounty_id)), None)
    if bounty_idx is None:
         raise HTTPException(status_code=404)
    
    # Tx already broadcast from frontend
    if payload.user_address != bounties_db[bounty_idx].get("creator_address"):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    bounties_db[bounty_idx]["status"] = "disputed"
    save_bounties(bounties_db)
    return {"message": "Bounty disputed", "tx_id": payload.tx_id, "bounty": bounties_db[bounty_idx]}

@app.post("/bounties/{bounty_id}/resolve_dispute")
def resolve_dispute(bounty_id: str, payload: ActionRequest):
    bounty_idx = next((i for i, b in enumerate(bounties_db) if str(b.get("id")) == str(bounty_id)), None)
    if bounty_idx is None:
         raise HTTPException(status_code=404)
         
    # Tx already broadcast from frontend
    if payload.user_address != bounties_db[bounty_idx].get("creator_address"):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    if payload.resolution == "approve":
        bounties_db[bounty_idx]["status"] = "completed"
    elif payload.resolution == "reject":
        bounties_db[bounty_idx]["status"] = "refunded"
    else:
        bounties_db[bounty_idx]["status"] = "resolved"

    save_bounties(bounties_db)
    return {"status": "success", "message": "Dispute resolved", "txid": payload.tx_id, "bounty": bounties_db[bounty_idx]}

@app.get("/wallet/{address}")
def get_wallet_info(address: str):
    try:
        account_info = client.account_info(address)
        algo_balance = account_info.get("amount", 0) / 1_000_000.0
    except Exception as e:
        print(f"Failed to fetch account info for {address}: {e}")
        algo_balance = 0.0

    return {
        "address": address,
        "balance": algo_balance,
        "completedBounties": len([b for b in bounties_db if b.get("status") == "completed" and b.get("worker") == address]),
        "totalEarned": sum(float(b.get("reward", 0)) for b in bounties_db if b.get("status") == "completed" and b.get("worker") == address)
    }
