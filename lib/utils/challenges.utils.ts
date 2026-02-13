import type { Challenge } from "@/lib/types"

export function isChallengeEditable(challenge: Challenge): boolean {
  if (!challenge.data_fim) return true
  const today = new Date().toISOString().split("T")[0]
  return today <= challenge.data_fim
}
