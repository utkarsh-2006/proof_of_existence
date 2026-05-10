# Proof of Existence

A small Next.js app for checking whether a document hash exists on an Ethereum Sepolia smart contract.

## What it does

1. The user selects a file.
2. The browser hashes the file locally with SHA-256.
3. The app checks the deployed Sepolia contract with `verifyProof(bytes32)`.
4. If no proof exists, the user can register the hash through MetaMask with `storeProof(bytes32)`.

The actual file never leaves the user's machine. Only the hash is checked or stored on-chain.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Requirements

- Node.js
- MetaMask
- Sepolia network enabled in MetaMask
- Sepolia test ETH for registering proofs

Verification is read-only and does not require gas. Registration requires MetaMask and Sepolia test ETH.
