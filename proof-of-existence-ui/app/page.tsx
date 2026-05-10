"use client"

import type React from "react"
import { ethers } from "ethers"

import { useState } from "react"
import { Copy, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevolvingGlobe } from "@/components/revolving-globe"



export default function ProofOfExistence() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [documentHash, setDocumentHash] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [statusType, setStatusType] = useState<"success" | "error" | "">("")
  const [showVerifyTooltip, setShowVerifyTooltip] = useState(false)
  const [showRegisterTooltip, setShowRegisterTooltip] = useState(false)
  const [showFullHash, setShowFullHash] = useState(false)
 // ===== Blockchain config =====
const CONTRACT_ADDRESS = "0xFA26FCD5Eefb831A7B7fC10f04B0E60a3Bb3e0e0"

const CONTRACT_ABI = [
  "function storeProof(bytes32 documentHash)",
  "function verifyProof(bytes32 documentHash) view returns (bool)"
]

// Sepolia read-only provider
const readProvider = new ethers.JsonRpcProvider(
  "https://ethereum-sepolia.publicnode.com"
)

const readContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  readProvider
)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setDocumentHash("")
      setStatusMessage("")
      setStatusType("")
    }
  }

  const truncateHash = (hash: string) => {
    if (hash.length <= 12) return hash
    return `${hash.slice(0, 6)}…${hash.slice(-4)}`
  }

  const handleVerify = async () => {
  if (!selectedFile) return

  try {
    setIsLoading(true)
    setStatusMessage("Hashing document…")

    // 1️⃣ Hash file locally
    const buffer = await selectedFile.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
    const hashHex =
      "0x" +
      Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")

    setDocumentHash(hashHex)
    setStatusMessage("Checking blockchain…")

    // 2️⃣ Query blockchain
    const exists = await readContract.verifyProof(hashHex)

    if (exists) {
      setStatusMessage("✅ Proof exists on blockchain")
    } else {
      setStatusMessage("❌ No proof found for this document")
    }
  } catch (err) {
    console.warn("Verification failed", err)
    setStatusMessage("⚠️ Verification failed")
  } finally {
    setIsLoading(false)
  }
}


  const handleRegister = async () => {
  if (!selectedFile || !documentHash) return

  try {
    if (!window.ethereum) {
      alert("MetaMask not found")
      return
    }

    setIsLoading(true)
    setStatusMessage("Connecting wallet…")

    // 1️⃣ Wallet connection
    const browserProvider = new ethers.BrowserProvider(window.ethereum)
    await browserProvider.send("eth_requestAccounts", [])
    const signer = await browserProvider.getSigner()

    const writeContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    )

    // 2️⃣ Send transaction
    setStatusMessage("Submitting transaction…")
    const tx = await writeContract.storeProof(documentHash)

    // 3️⃣ Wait for confirmation
    setStatusMessage("Waiting for confirmation…")
    await tx.wait()

    setStatusMessage("✅ Proof anchored permanently on blockchain")
  } catch (err) {
    const code = (err as { code?: string | number })?.code

    if (code === 4001 || code === "ACTION_REJECTED") {
      setStatusMessage("Transaction cancelled in MetaMask")
    } else {
      console.warn("Transaction failed", err)
      setStatusMessage("❌ Transaction failed")
    }
  } finally {
    setIsLoading(false)
  }
}


  const copyToClipboard = () => {
    if (documentHash) {
      navigator.clipboard.writeText(documentHash)
      setStatusMessage("Hash copied to clipboard")
      setStatusType("success")
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-20 md:py-20 relative overflow-hidden">
      <RevolvingGlobe />

      <div className="relative w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-emerald-500/30 border border-emerald-500/50 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">SYSTEM OPERATIONAL</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Proof of Existence</h1>
          <p className="text-white/60 text-base mb-6">Immutable proof, anchored in time.</p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label htmlFor="fileInput" className="block mb-2 text-xs font-medium text-white/80">
            Select Document
          </label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-3 bg-white/15 border border-white/30 rounded-lg text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-cyan-500/30 file:text-cyan-400 hover:file:bg-cyan-500/40 cursor-pointer transition-all"
          />
          {selectedFile && <p className="mt-2 text-xs text-white/60">Selected: {selectedFile.name}</p>}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Button
              id="verifyBtn"
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-400 border border-cyan-500/40 font-medium text-sm transition-all"
            >
              Verify
            </Button>
            <button
              onMouseEnter={() => setShowVerifyTooltip(true)}
              onMouseLeave={() => setShowVerifyTooltip(false)}
              className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-cyan-500/30 border border-cyan-500/50 flex items-center justify-center hover:bg-cyan-500/40 transition-all"
            >
              <Info className="w-3 h-3 text-cyan-400" />
            </button>
            {showVerifyTooltip && (
              <div className="absolute -top-12 left-0 right-0 bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/10 z-10">
                Check if this document exists on the blockchain
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              id="registerBtn"
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/40 font-medium text-sm transition-all"
            >
              Register Proof
            </Button>
            <button
              onMouseEnter={() => setShowRegisterTooltip(true)}
              onMouseLeave={() => setShowRegisterTooltip(false)}
              className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center hover:bg-emerald-500/40 transition-all"
            >
              <Info className="w-3 h-3 text-emerald-400" />
            </button>
            {showRegisterTooltip && (
              <div className="absolute -top-12 left-0 right-0 bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/10 z-10">
                Register this document as proof on the blockchain
              </div>
            )}
          </div>
        </div>

        {/* Loading Message */}
        {isLoading && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-white/80 text-sm">
              <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              {loadingMessage}
            </div>
          </div>
        )}

        {/* Result Section */}
        <div
          id="result"
          className={`transition-all duration-300 ${documentHash ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
        >
          {documentHash && (
            <div className="bg-white/15 border border-white/30 rounded-lg p-6 mb-6">
              <label className="block text-xs font-medium text-white/80 mb-3">Document Hash</label>
              <div className="flex items-center gap-3">
                <div
                  className="relative flex-1 group"
                  onMouseEnter={() => setShowFullHash(true)}
                  onMouseLeave={() => setShowFullHash(false)}
                >
                  <code className="block px-4 py-2 bg-black/60 border border-white/10 rounded text-cyan-400 font-mono text-xs">
                    {truncateHash(documentHash)}
                  </code>
                  {showFullHash && (
                    <div className="absolute -top-12 left-0 right-0 bg-black/95 backdrop-blur-sm text-cyan-400 text-xs px-3 py-2 rounded-lg border border-cyan-500/30 z-10 font-mono break-all">
                      {documentHash}
                    </div>
                  )}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all group"
                  title="Copy hash"
                >
                  <Copy className="w-4 h-4 text-white/60 group-hover:text-cyan-400 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`text-center p-4 rounded-lg border text-sm ${
              statusType === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  )
}
