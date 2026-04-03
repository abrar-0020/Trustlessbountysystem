from pyteal import *

def approval_program():
    # Global state keys
    creator_key = Bytes("creator")
    reward_key = Bytes("reward")
    deadline_key = Bytes("deadline")
    submission_key = Bytes("submission") # IPFS hash of the proof
    status_key = Bytes("status") # 0: pending, 1: submitted, 2: completed, 3: disputed

    STATUS_PENDING = Int(0)
    STATUS_SUBMITTED = Int(1)
    STATUS_COMPLETED = Int(2)
    STATUS_DISPUTED = Int(3)

    # 1. create_bounty (App creation)
    # Initializes the bounty variables.
    # App deployment args:
    # arg 0: reward (int)
    # arg 1: deadline (uint64 timestamp)
    on_create_bounty = Seq([
        App.globalPut(creator_key, Txn.sender()),
        App.globalPut(reward_key, Btoi(Txn.application_args[0])),
        App.globalPut(deadline_key, Btoi(Txn.application_args[1])),
        App.globalPut(status_key, STATUS_PENDING),
        Return(Int(1))
    ])

    # 2. submit_proof
    # Worker submits proof of completion (IPFS hash).
    # Application Call. 
    # arg 0: "submit_proof"
    # arg 1: IPFS hash (bytes)
    proof_hash = Txn.application_args[1]
    on_submit_proof = Seq([
        # Verify bounty is pending
        Assert(App.globalGet(status_key) == STATUS_PENDING),
        # Verify deadline has not passed
        Assert(Global.latest_timestamp() <= App.globalGet(deadline_key)),
        
        # Store proof hash and update status
        App.globalPut(submission_key, proof_hash),
        App.globalPut(status_key, STATUS_SUBMITTED),
        Return(Int(1))
    ])

    # 3. validate_and_release
    # Releases funds to worker automatically upon validation.
    # Application Call.
    # arg 0: "validate_and_release"
    # Accounts array must include the worker's address at index 1.
    worker_account = Txn.accounts[1]
    on_validate_and_release = Seq([
        # Ensure submission exists
        Assert(App.globalGet(status_key) == STATUS_SUBMITTED),
        # Ensure the caller is the creator (validator in this demo)
        Assert(Txn.sender() == App.globalGet(creator_key)),
        
        # Inner transaction to release funds from escrow to worker
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: worker_account,
            TxnField.amount: App.globalGet(reward_key),
            TxnField.fee: Int(0) # Fee handled by caller via pooling
        }),
        InnerTxnBuilder.Submit(),
        
        # Mark bounty as completed
        App.globalPut(status_key, STATUS_COMPLETED),
        Return(Int(1))
    ])

    # 4. raise_dispute
    # Allows flagging the bounty for dispute if conditions fail
    # Application Call.
    # arg 0: "raise_dispute"
    on_raise_dispute = Seq([
        # Disallow dispute if already completed
        Assert(App.globalGet(status_key) != STATUS_COMPLETED),
        # Only the creator can raise a dispute for the simplicity of this demo
        Assert(Txn.sender() == App.globalGet(creator_key)),
        
        # Mark bounty as disputed
        App.globalPut(status_key, STATUS_DISPUTED),
        Return(Int(1))
    ])

    # Application Call routing logic
    on_call_method = Txn.application_args[0]
    
    on_call = Cond(
        [on_call_method == Bytes("submit_proof"), on_submit_proof],
        [on_call_method == Bytes("validate_and_release"), on_validate_and_release],
        [on_call_method == Bytes("raise_dispute"), on_raise_dispute]
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create_bounty],
        [Txn.on_completion() == OnComplete.NoOp, on_call],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == App.globalGet(creator_key))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == App.globalGet(creator_key))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(0))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(0))]
    )

    return program

def clear_state_program():
    # Allow users to clear state cleanly
    return Return(Int(1))

if __name__ == "__main__":
    # Compile the smart contract to TEAL when the script is run
    with open("bounty_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=6)
        f.write(compiled)

    with open("bounty_clear_state.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=6)
        f.write(compiled)

    print("Successfully compiled smart contract to TEAL!")
