import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported operating modes for the mnemonic flow */
export type MnemonicFlowMode = "display" | "create" | "import" | "verify"

/** Number of words in a mnemonic seed phrase */
export type MnemonicWordCount = 12 | 15 | 18 | 21 | 24

/** A verification challenge requiring the user to confirm specific word positions */
export interface VerificationChallenge {
  /** The two positions (0-indexed) the user must fill in */
  positions: [number, number]
  /** The user's current answers keyed by position index */
  answers: Record<number, string>
}

/** Options for the useMnemonicFlow hook */
export interface UseMnemonicFlowOptions {
  /** Operating mode (default: "display") */
  mode: MnemonicFlowMode
  /** Pre-populated words for display/verify modes */
  words?: string[]
  /** Number of words to display/import (default: 12) */
  wordCount?: MnemonicWordCount
  /** Called when the flow completes with the final word list */
  onComplete?: (words: string[]) => void
  /** Called when the user cancels the flow */
  onCancel?: () => void
}

/** Return value of the useMnemonicFlow hook */
export interface UseMnemonicFlowReturn {
  /** The current word list */
  words: string[]
  /** The operating mode */
  mode: MnemonicFlowMode
  /** Expected word count */
  wordCount: MnemonicWordCount
  /** Whether the confirmation checkbox is checked (create mode) */
  confirmed: boolean
  /** Toggle the confirmation checkbox */
  setConfirmed: (value: boolean) => void
  /** Update a single word at a given index (import mode) */
  setWord: (index: number, value: string) => void
  /** Replace the full word list */
  setWords: (words: string[]) => void
  /** Verification challenge state (verify mode) */
  challenge: VerificationChallenge | null
  /** Update a verification answer */
  setVerificationAnswer: (position: number, value: string) => void
  /** Whether the current state is valid for submission */
  isValid: boolean
  /** Whether the flow can be submitted */
  canSubmit: boolean
  /** Submit the flow, invoking onComplete */
  submit: () => void
  /** Cancel the flow, invoking onCancel */
  cancel: () => void
  /** Copy all words to clipboard */
  copyWords: () => Promise<void>
  /** Whether the words were recently copied */
  copied: boolean
  /** Error message for the current state */
  error: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pick two random, distinct positions from a word list.
 * Uses Math.random which is acceptable for UI challenges (not cryptographic).
 */
function pickChallengePositions(
  wordCount: number
): [number, number] {
  const first = Math.floor(Math.random() * wordCount)
  let second = Math.floor(Math.random() * (wordCount - 1))
  if (second >= first) second += 1
  const lo = Math.min(first, second)
  const hi = Math.max(first, second)
  return [lo, hi]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages all state and logic for the mnemonic seed phrase flow.
 *
 * Supports four modes:
 * - **display**: Read-only grid with copy-all button
 * - **create**: Shows supplied words, requires confirmation checkbox
 * - **import**: Editable grid for entering a seed phrase
 * - **verify**: Shows 2 random word positions the user must fill in correctly
 *
 * The hook owns no UI and imports nothing from the presentation layer.
 *
 * @example
 * ```ts
 * const flow = useMnemonicFlow({
 *   mode: "create",
 *   words: generatedWords,
 *   onComplete: (words) => createWallet(words.join(" ")),
 * })
 * ```
 */
export function useMnemonicFlow({
  mode,
  words: initialWords,
  wordCount = 12,
  onComplete,
  onCancel,
}: UseMnemonicFlowOptions): UseMnemonicFlowReturn {
  const [words, setWords] = useState<string[]>(
    () => initialWords ? [...initialWords] : Array<string>(wordCount).fill("")
  )
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verification challenge resets when its input phrase or mode changes.
  const [challenge, setChallenge] = useState<VerificationChallenge | null>(() => {
    if (mode !== "verify" || (initialWords?.length ?? wordCount) < 2) return null
    const count = initialWords?.length ?? wordCount
    return {
      positions: pickChallengePositions(count),
      answers: {},
    }
  })

  const [verificationAnswers, setVerificationAnswers] = useState<
    Record<number, string>
  >({})

  // Compare content, not array identity: parent rerenders must preserve answers.
  const inputSignature = JSON.stringify([mode, wordCount, initialWords])
  const [previousInput, setPreviousInput] = useState(inputSignature)
  if (previousInput !== inputSignature) {
    setPreviousInput(inputSignature)
    setWords(initialWords ? [...initialWords] : Array(wordCount).fill(""))
    setConfirmed(false)
    setCopied(false)
    setError(null)
    setVerificationAnswers({})
    const count = initialWords?.length ?? wordCount
    setChallenge(mode === "verify" && count >= 2
      ? { positions: pickChallengePositions(count), answers: {} }
      : null)
  }

  // Ref for copy timeout cleanup
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Clean up pending timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== undefined) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  // Combine challenge with answers
  const challengeWithAnswers = useMemo<VerificationChallenge | null>(() => {
    if (!challenge) return null
    return { ...challenge, answers: verificationAnswers }
  }, [challenge, verificationAnswers])

  const setWord = useCallback(
    (index: number, value: string) => {
      setWords((prev) => {
        const next = [...prev]
        next[index] = value.trim().toLowerCase()
        return next
      })
      setError(null)
    },
    []
  )

  const setVerificationAnswer = useCallback(
    (position: number, value: string) => {
      setVerificationAnswers((prev) => ({
        ...prev,
        [position]: value.trim().toLowerCase(),
      }))
      setError(null)
    },
    []
  )

  // Presence/challenge checks only. No mnemonic checksum or wallet derivation validation.
  const isValid = useMemo(() => {
    switch (mode) {
      case "display":
        return words.length > 0 && words.every((w) => w.length > 0)

      case "create":
        return (
          confirmed &&
          words.length > 0 &&
          words.every((w) => w.length > 0)
        )

      case "import":
        return (
          words.length === wordCount &&
          words.every((w) => w.length > 0)
        )

      case "verify": {
        if (!challenge || !initialWords) return false
        const [pos1, pos2] = challenge.positions
        return (
          verificationAnswers[pos1]?.toLowerCase() ===
            initialWords[pos1]?.toLowerCase() &&
          verificationAnswers[pos2]?.toLowerCase() ===
            initialWords[pos2]?.toLowerCase()
        )
      }

      default:
        return false
    }
  }, [mode, words, confirmed, wordCount, challenge, initialWords, verificationAnswers])

  const canSubmit = useMemo(() => {
    if (mode === "display") return false
    if (mode === "verify") return challenge !== null && challenge.positions.every(
      (position) => Boolean(verificationAnswers[position]?.trim())
    )
    return isValid
  }, [mode, isValid, challenge, verificationAnswers])

  const submit = useCallback(() => {
    if (!canSubmit) return

    if (mode === "verify") {
      if (!isValid) {
        setError("Incorrect words. Please check and try again.")
        return
      }
      onComplete?.(initialWords ?? words)
      return
    }

    onComplete?.(words)
  }, [canSubmit, mode, isValid, words, initialWords, onComplete])

  const cancel = useCallback(() => {
    onCancel?.()
  }, [onCancel])

  const copyWords = useCallback(async () => {
    if (typeof navigator === "undefined" || (mode !== "display" && mode !== "create")) return
    try {
      await navigator.clipboard.writeText(words.join(" "))
      setCopied(true)
      if (copyTimeoutRef.current !== undefined) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Failed to copy to clipboard")
    }
  }, [words, mode])

  return {
    words,
    mode,
    wordCount,
    confirmed,
    setConfirmed,
    setWord,
    setWords,
    challenge: challengeWithAnswers,
    setVerificationAnswer,
    isValid,
    canSubmit,
    submit,
    cancel,
    copyWords,
    copied,
    error,
  }
}
