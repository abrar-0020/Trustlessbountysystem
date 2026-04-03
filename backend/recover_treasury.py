"""
recover_treasury.py
─────────────────────────────────────────────────────────
Sends all ALGO from the treasury wallet back to the
demo (main) wallet address.

Run with:
    python recover_treasury.py
"""
import time
from algosdk import mnemonic, account, transaction
from algosdk.v2client import algod

ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN   = ""
client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Load main wallet
with open("demo_wallet.txt", "r") as f:
    demo_mnemonic = f.read().strip()
demo_private_key = mnemonic.to_private_key(demo_mnemonic)
demo_address     = account.address_from_private_key(demo_private_key)

# Load treasury wallet
with open("treasury_wallet.txt", "r") as f:
    treasury_mnemonic = f.read().strip()
treasury_private_key = mnemonic.to_private_key(treasury_mnemonic)
treasury_address     = account.address_from_private_key(treasury_private_key)

print("=" * 60)
print(f"Main Wallet (destination) : {demo_address}")
print(f"Treasury Wallet (source)  : {treasury_address}")

try:
    t_info = client.account_info(treasury_address)
    treasury_balance = t_info.get("amount", 0)
    print(f"Treasury Balance          : {treasury_balance / 1_000_000:.6f} ALGO")
except Exception as e:
    print(f"Could not fetch treasury info: {e}")
    exit(1)

MIN_BALANCE = 100_000  # 0.1 ALGO minimum required to keep account alive
FEE         = 1_000    # standard tx fee
sendable    = treasury_balance - MIN_BALANCE - FEE

if sendable <= 0:
    print("Nothing to send (balance too low to cover fee + min balance).")
    exit(0)

print(f"Sending back              : {sendable / 1_000_000:.6f} ALGO")
print("=" * 60)

sp = client.suggested_params()

# Close-remainder-to sends 100% of the balance (including min balance)
# by closing the account entirely. We'll do a regular send for safety.
txn = transaction.PaymentTxn(
    sender=treasury_address,
    sp=sp,
    receiver=demo_address,
    amt=sendable,
    note=b"Treasury -> Demo Wallet Recovery"
)

signed = txn.sign(treasury_private_key)
txid   = client.send_transaction(signed)
print(f"TX sent: {txid}")

# Wait for confirmation
txinfo = client.pending_transaction_info(txid)
while not (txinfo.get("confirmed-round") and txinfo.get("confirmed-round") > 0):
    time.sleep(1)
    txinfo = client.pending_transaction_info(txid)

print(f"✅ Confirmed in round {txinfo['confirmed-round']}")

# Show updated balances
time.sleep(2)
main_info = client.account_info(demo_address)
new_main  = main_info.get("amount", 0) / 1_000_000
print(f"\nMain wallet new balance: {new_main:.4f} ALGO")
print("=" * 60)
