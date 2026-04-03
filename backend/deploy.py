import base64
import time
from algosdk.v2client import algod
from algosdk import account, mnemonic
from algosdk.transaction import ApplicationCreateTxn, StateSchema, OnComplete

# LocalNet config (Algorand Sandbox/LocalNet default settings)
ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

def get_client():
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def compile_program(client, source_code):
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])

def deploy_bounty_contract(creator_private_key, reward_amount, deadline_timestamp):
    """
    Deploys the Bounty PyTeal smart contract to the Algorand blockchain.
    """
    try:
        client = get_client()

        # Read TEAL files
        with open("bounty_approval.teal", "r") as f:
            approval_source = f.read()

        with open("bounty_clear_state.teal", "r") as f:
            clear_source = f.read()

        # Compile TEAL to binary components
        print("Compiling TEAL programs...")
        approval_program = compile_program(client, approval_source)
        clear_program = compile_program(client, clear_source)

        # State Schema: 
        # Global ints: status, reward, deadline (3)
        # Global bytes: creator, submission (2)
        global_schema = StateSchema(num_uints=3, num_byte_slices=2)
        local_schema = StateSchema(num_uints=0, num_byte_slices=0)

        # Get network params
        sp = client.suggested_params()
        
        # Application Deploy Arguments: reward(int), deadline(int)
        app_args = [
            reward_amount.to_bytes(8, "big"),
            deadline_timestamp.to_bytes(8, "big")
        ]

        creator_address = account.address_from_private_key(creator_private_key)
        print(f"Deploying from address: {creator_address}")

        txn = ApplicationCreateTxn(
            sender=creator_address,
            sp=sp,
            on_complete=OnComplete.NoOpOC,
            approval_program=approval_program,
            clear_program=clear_program,
            global_schema=global_schema,
            local_schema=local_schema,
            app_args=app_args,
        )

        # Sign and submit
        signed_txn = txn.sign(creator_private_key)
        tx_id = client.send_transaction(signed_txn)
        print(f"Deploying Bounty Contract with transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("Waiting for confirmation...")
        confirmed_txn = client.pending_transaction_info(tx_id)
        while confirmed_txn.get("confirmed-round", 0) == 0:
            confirmed_txn = client.pending_transaction_info(tx_id)
            time.sleep(1)
            
        print(f"Transaction {tx_id} confirmed in round {confirmed_txn.get('confirmed-round')}.")
        
        app_id = confirmed_txn["application-index"]
        print(f"Successfully deployed! New App ID: {app_id}")
        return app_id

    except Exception as e:
        print(f"Error deploying app: {e}")
        return None

if __name__ == "__main__":
    print("--- Trustless Bounty Escrow Deployer ---")
    print("WARNING: Make sure your Algorand LocalNet (sandbox) is running to deploy.")
    
    # Normally you would import a local mnemonic or environment variable.
    # We will generate an ephemeral account to show usage, which would fail if it has 0 Algos.
    # In a real environment, fund this generated_account first using a dispenser, or use your local sandbox accounts.
    print("Generating ephemeral test account...")
    private_key, address = account.generate_account()
    print(f"Address: {address}")
    
    print("\nAttempting deployment (this will fail if the node is offline or the account lacks funds):")
    # Deploy an example 50 ALGO bounty (50,000,000 microAlgos) with deadline 2 days from now.
    deploy_bounty_contract(private_key, 50_000_000, int(time.time()) + (86400 * 2))
