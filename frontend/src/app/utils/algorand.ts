import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

const ALGOD_SERVER = "https://testnet-api.algonode.cloud";
export const algodClient = new algosdk.Algodv2("", ALGOD_SERVER, "");

// ─── Internal helpers ────────────────────────────────────────────────────────

function b64ToUint8Array(b64: string): Uint8Array {
    const raw = atob(b64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
}

async function broadcast(signedTxn: Uint8Array): Promise<string> {
    if (!signedTxn) throw new Error("Transaction signature missing (possibly cancelled in wallet)");
    // Defensive typecast for polyfilled Uint8Array environments (solves 'Argument must be byte array' error)
    const rawTxnBytes = signedTxn instanceof Uint8Array ? signedTxn : new Uint8Array(signedTxn);
    const resp = await algodClient.sendRawTransaction(rawTxnBytes).do();
    const txId: string = (resp as any).txId ?? (resp as any).txid ?? "";
    await algosdk.waitForConfirmation(algodClient, txId, 8);
    return txId;
}

export async function fetchTealPrograms() {
    const res = await fetch("http://127.0.0.1:8000/teal");
    if (!res.ok) throw new Error("Failed to fetch TEAL from backend");
    const data = await res.json();
    return {
        approval: b64ToUint8Array(data.approval),
        clear: b64ToUint8Array(data.clear),
    };
}

// ─── 1. Create + Fund Bounty ─────────────────────────────────────────────────
// Signs, broadcasts app-create, waits for confirmation (extracts app_id),
// then signs + broadcasts the escrow-funding payment. All on-chain ops happen
// here in the browser; the backend only stores metadata.

export async function createAndFundBounty(
    peraWallet: PeraWalletConnect,
    senderAddress: string,
    rewardAlgo: number,
    deadlineTimestamp: number
): Promise<{ deployTxId: string; fundTxId: string; appId: number }> {
    const { approval, clear } = await fetchTealPrograms();
    const params = await algodClient.getTransactionParams().do();
    const rewardMicro = Math.floor(rewardAlgo * 1_000_000);
    const encoder = new TextEncoder();

    // Build app-create transaction
    const appDeployTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: senderAddress,
        approvalProgram: approval,
        clearProgram: clear,
        numGlobalInts: 3,
        numGlobalByteSlices: 2,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        appArgs: [algosdk.encodeUint64(rewardMicro), algosdk.encodeUint64(deadlineTimestamp)],
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
    });

    // Sign via Pera Wallet
    const deployGroup = [[{ txn: appDeployTxn, signers: [senderAddress] }]];
    const [signedDeploy] = await peraWallet.signTransaction(deployGroup);

    // Broadcast + wait
    const deployResp = await algodClient.sendRawTransaction(signedDeploy).do();
    const deployTxId: string = (deployResp as any).txId ?? (deployResp as any).txid ?? "";
    const deployConfirm = await algosdk.waitForConfirmation(algodClient, deployTxId, 8);
    const appId = Number(
        (deployConfirm as any)["application-index"] ??
        (deployConfirm as any).applicationIndex ??
        0
    );

    if (!appId) throw new Error("Could not extract App ID from deployment confirmation");

    // Build payment to fund the escrow
    const freshParams = await algodClient.getTransactionParams().do();
    const escrowAddress = algosdk.getApplicationAddress(appId);
    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: escrowAddress,
        amount: rewardMicro + 100_000, // reward + min balance
        suggestedParams: freshParams,
    });

    // Sign via Pera Wallet
    const fundGroup = [[{ txn: fundTxn, signers: [senderAddress] }]];
    const [signedFund] = await peraWallet.signTransaction(fundGroup);

    // Broadcast + wait
    const fundResp = await algodClient.sendRawTransaction(signedFund).do();
    const fundTxId: string = (fundResp as any).txId ?? (fundResp as any).txid ?? "";
    await algosdk.waitForConfirmation(algodClient, fundTxId, 8);

    return { deployTxId, fundTxId, appId };
}

// ─── 2. Submit Proof ─────────────────────────────────────────────────────────

export async function submitProofOnChain(
    peraWallet: PeraWalletConnect,
    senderAddress: string,
    appId: number,
    workLink: string
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    const encoder = new TextEncoder();

    const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: senderAddress,
        appIndex: appId,
        suggestedParams: params,
        appArgs: [encoder.encode("submit_proof"), encoder.encode(workLink)],
    });

    const [signed] = await peraWallet.signTransaction([[{ txn: callTxn, signers: [senderAddress] }]]);
    return await broadcast(signed);
}

// ─── 3. Validate + Release ───────────────────────────────────────────────────

export async function validateOnChain(
    peraWallet: PeraWalletConnect,
    senderAddress: string,
    workerAddress: string,
    appId: number
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    params.fee = BigInt(Number(params.minFee) * 2);
    params.flatFee = true;
    const encoder = new TextEncoder();

    const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: senderAddress,
        appIndex: appId,
        suggestedParams: params,
        appArgs: [encoder.encode("validate_and_release")],
        accounts: [workerAddress],
    });

    const [signed] = await peraWallet.signTransaction([[{ txn: callTxn, signers: [senderAddress] }]]);
    return await broadcast(signed);
}

// ─── 4. Raise Dispute ────────────────────────────────────────────────────────

export async function disputeOnChain(
    peraWallet: PeraWalletConnect,
    senderAddress: string,
    appId: number
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    const encoder = new TextEncoder();

    const callTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: senderAddress,
        appIndex: appId,
        suggestedParams: params,
        appArgs: [encoder.encode("raise_dispute")],
    });

    const [signed] = await peraWallet.signTransaction([[{ txn: callTxn, signers: [senderAddress] }]]);
    return await broadcast(signed);
}

// ─── 5. Resolve Dispute ──────────────────────────────────────────────────────

export async function resolveDisputeOnChain(
    peraWallet: PeraWalletConnect,
    senderAddress: string,
    workerAddress: string,
    appId: number,
    resolution: "approve" | "reject"
): Promise<string> {
    const params = await algodClient.getTransactionParams().do();
    params.fee = BigInt(Number(params.minFee) * 2);
    params.flatFee = true;
    const encoder = new TextEncoder();

    let txn;
    if (resolution === "approve") {
        txn = algosdk.makeApplicationNoOpTxnFromObject({
            sender: senderAddress,
            appIndex: appId,
            suggestedParams: params,
            appArgs: [encoder.encode("validate_and_release")],
            accounts: [workerAddress],
        });
    } else {
        txn = algosdk.makeApplicationDeleteTxnFromObject({
            sender: senderAddress,
            appIndex: appId,
            suggestedParams: params,
        });
    }

    const [signed] = await peraWallet.signTransaction([[{ txn, signers: [senderAddress] }]]);
    return await broadcast(signed);
}
