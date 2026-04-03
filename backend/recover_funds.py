"""
recover_funds.py  (v2 - Full Recovery)
─────────────────────────────────────────────────────────
Finds every Algorand application created by your demo wallet,
then DELETES each one. The updated TEAL contract automatically
closes the escrow balance back to the creator during deletion,
so 100% of locked ALGO is returned.

Run with:
    python recover_funds.py
"""
import time
import requests
from algosdk import mnemonic, account, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address

# ── Algorand TestNet clients ─────────────────────────────────────────
ALGOD_ADDRESS   = "https://testnet-api.algonode.cloud"
INDEXER_ADDRESS = "https://testnet-idx.algonode.cloud"
ALGOD_TOKEN     = ""

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# ── Load the demo wallet ─────────────────────────────────────────────
with open("demo_wallet.txt", "r") as f:
    demo_mnemonic = f.read().strip()
private_key  = mnemonic.to_private_key(demo_mnemonic)
demo_address = account.address_from_private_key(private_key)

def get_balance(address: str) -> float:
    try:
        info = algod_client.account_info(address)
        return info.get("amount", 0) / 1_000_000
    except:
        return 0.0

print("=" * 60)
print(f"Wallet : {demo_address}")
print(f"Balance: {get_balance(demo_address):.4f} ALGO")
print("=" * 60)

# ── Find all apps created by this wallet ─────────────────────────────
def get_created_apps(address: str) -> list[int]:
    url = f"{INDEXER_ADDRESS}/v2/accounts/{address}/created-applications"
    try:
        res  = requests.get(url, timeout=10)
        data = res.json()
        apps = data.get("applications", [])
        return [a["id"] for a in apps if not a.get("deleted", False)]
    except Exception as e:
        print(f"Indexer error: {e}")
        return []

def wait_confirm(txid: str):
    txinfo = algod_client.pending_transaction_info(txid)
    while not (txinfo.get("confirmed-round") and txinfo.get("confirmed-round") > 0):
        time.sleep(1)
        txinfo = algod_client.pending_transaction_info(txid)
    return txinfo

print("Searching for your smart contracts on TestNet...")
app_ids = get_created_apps(demo_address)

if not app_ids:
    print("No active applications found. Wallet is clean!")
else:
    print(f"Found {len(app_ids)} active contract(s): {app_ids}\n")

    recovered = 0
    for app_id in app_ids:
        escrow = get_application_address(app_id)
        escrow_balance = get_balance(escrow)
        print(f"  App {app_id} | Escrow {escrow[:12]}... | Balance {escrow_balance:.4f} ALGO")

        try:
            sp = algod_client.suggested_params()
            # The updated TEAL delete handler fires an inner transaction
            # that closes the escrow CloseRemainderTo=creator before deletion.
            delete_txn = transaction.ApplicationDeleteTxn(
                sender=demo_address,
                sp=sp,
                index=app_id,
            )
            signed = delete_txn.sign(private_key)
            txid   = algod_client.send_transaction(signed)
            wait_confirm(txid)
            print(f"  ✅ Deleted + escrow closed | TX: {txid[:14]}...")
            recovered += 1
        except Exception as e:
            print(f"  ⚠️  Error on app {app_id}: {e}")
            print(f"     (App may have been deployed with old TEAL without close-out support)")

    print()
    print(f"Done! Recovered {recovered}/{len(app_ids)} contracts.")

# ── Also recover from treasury ────────────────────────────────────────
import os
if os.path.exists("treasury_wallet.txt"):
    with open("treasury_wallet.txt", "r") as f:
        t_mnemonic = f.read().strip()
    t_private_key = mnemonic.to_private_key(t_mnemonic)
    t_address     = account.address_from_private_key(t_private_key)
    t_balance_micro = algod_client.account_info(t_address).get("amount", 0)
    sendable = t_balance_micro - 100_000 - 1_000  # keep min balance + fee

    if sendable > 0:
        print(f"\nRecovering {sendable/1_000_000:.4f} ALGO from treasury...")
        sp  = algod_client.suggested_params()
        txn = transaction.PaymentTxn(t_address, sp, demo_address, sendable)
        tx  = algod_client.send_transaction(txn.sign(t_private_key))
        wait_confirm(tx)
        print(f"✅ Treasury recovered | TX: {tx[:14]}...")

# ── Print final balance ───────────────────────────────────────────────
time.sleep(2)
print()
print(f"Final wallet balance: {get_balance(demo_address):.4f} ALGO")
print("=" * 60)
