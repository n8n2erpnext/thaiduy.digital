import 'server-only'

import { readFile } from 'node:fs/promises'

const HISTORY_PATH =
  process.env.SENTINEL_DIALOGUE_HISTORY ||
  '/home/ubuntu/services/sentinel-dialogue/history.jsonl'

type DialogueRecord = {
  from?: string
  to?: string
  topic?: string
  interaction?: string
  seq?: number
  time?: string
  content?: {
    own_position?: {
      strongest_conclusion?: string
    }
  }
}

export type PublicSentinelMessage = {
  from: string
  to: string
  topic: string
  interaction: string
  seq: number | null
  time: string
  text: string
}

export async function getLatestPublicLunaMessage(): Promise<PublicSentinelMessage | null> {
  try {
    const raw = await readFile(HISTORY_PATH, 'utf8')
    const lines = raw.trim().split(/\r?\n/)

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index]
      if (!line) continue
      let record: DialogueRecord
      try {
        record = JSON.parse(line) as DialogueRecord
      } catch {
        continue
      }
      if (record.from !== 'Luna') continue
      const text = record.content?.own_position?.strongest_conclusion?.trim()
      if (!text) continue

      return {
        from: 'Luna',
        to: record.to?.trim() || 'Selene',
        topic: record.topic?.trim() || 'observation',
        interaction: record.interaction?.trim() || 'message',
        seq: typeof record.seq === 'number' ? record.seq : null,
        time: record.time || new Date(0).toISOString(),
        text,
      }
    }
  } catch {
    return null
  }

  return null
}
