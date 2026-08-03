"use client"

import { useState } from "react"
import {
  OpnsManagerUI,
  type OpnsNameDisplay,
  type OpnsOperationResult,
} from "@/registry/bigblocks/blocks/opns-manager"

const MOCK_NAMES: OpnsNameDisplay[] = [
  {
    id: "id:alice",
    outpoint:
      "58b7558ea379f24266c7e2f5fe321992ad9a724fd7a87423ba412677179ccb25_0",
    name: "alice",
    registered: true,
    identityKey: "02abc123def456789",
  },
  {
    id: "id:mystore",
    outpoint:
      "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2_0",
    name: "mystore",
    registered: false,
  },
  {
    id: "id:satoshi",
    outpoint:
      "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3_0",
    name: "satoshi",
    registered: true,
    identityKey: "03def789abc012345",
  },
  {
    id: "id:payments",
    outpoint:
      "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4_0",
    name: "payments",
    registered: false,
  },
]

function mockOperation(name: OpnsNameDisplay): Promise<OpnsOperationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        txid: `mock_${name.name}_${Date.now().toString(16)}`,
      })
    }, 1500)
  })
}

export default function OpnsManagerDemo() {
  const [names, setNames] = useState(MOCK_NAMES)

  const handleRegister = async (
    name: OpnsNameDisplay
  ): Promise<OpnsOperationResult> => {
    const result = await mockOperation(name)
    if (result.txid) {
      setNames((prev) =>
        prev.map((n) =>
          n.outpoint === name.outpoint ? { ...n, registered: true } : n
        )
      )
    }
    return result
  }

  const handleDeregister = async (
    name: OpnsNameDisplay
  ): Promise<OpnsOperationResult> => {
    const result = await mockOperation(name)
    if (result.txid) {
      setNames((prev) =>
        prev.map((n) =>
          n.outpoint === name.outpoint
            ? { ...n, registered: false, identityKey: undefined }
            : n
        )
      )
    }
    return result
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <OpnsManagerUI
        names={names}
        isLoading={false}
        isOperating={false}
        error={null}
        onRegister={handleRegister}
        onDeregister={handleDeregister}
        onRefresh={() => setNames(MOCK_NAMES)}
      />
    </div>
  )
}
