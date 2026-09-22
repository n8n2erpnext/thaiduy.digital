import 'server-only'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const DB_PATH =
  process.env.LUNA_SENTINEL_DB ||
  '/home/ubuntu/services/micro-sentinel/state/sentinel.db'

export type PublicLunaTelegramMessage = {
  kind: string
  severity: string
  pattern: string
  observations: number
  confidence: number
  deliveredAt: string
  title: string
  text: string
  scanFocus: string
}

const PYTHON = String.raw`
import json, sqlite3, sys
from collections import Counter

db_path=sys.argv[1]
c=sqlite3.connect(db_path)
rows=c.execute("""
select kind,severity,delivered_at,payload
from alert_outbox
where delivered_at is not null
order by delivered_at desc
limit 3
""").fetchall()

out=[]
for kind,severity,delivered_at,raw in rows:
    payload=json.loads(raw or "{}")
    day=str(payload.get("day") or "")
    scope=str(payload.get("scope") or "")
    pattern=str(payload.get("pattern") or "")
    evidence=payload.get("evidence") or {}

    focus=""
    if kind=="SUBNET_SCAN":
        sources=int(evidence.get("sources") or 0)
        hits=int(evidence.get("probe_hits") or 0)
        focus=f"distributed subnet probe · {sources} sources · {hits} probe hits"
    else:
        obs=c.execute(
            "select method,path,status from observations where ts like ? and src=?",
            (day+"%",scope)
        ).fetchall()
        if obs:
            paths=Counter(str(r[1] or "").split("?",1)[0] for r in obs)
            methods=Counter(str(r[0] or "") for r in obs)
            statuses=Counter(str(r[2]) for r in obs)
            top_path=paths.most_common(1)[0][0] if paths else ""
            method=methods.most_common(1)[0][0] if methods else ""
            status=statuses.most_common(1)[0][0] if statuses else ""
            focus=" · ".join(x for x in (method,top_path,status) if x)
        else:
            focus=pattern.replace("_"," ")

    out.append({
        "kind":str(kind or ""),
        "severity":str(severity or ""),
        "pattern":pattern,
        "observations":int(payload.get("count") or 0),
        "confidence":float(payload.get("confidence") or 0),
        "deliveredAt":str(delivered_at or ""),
        "scanFocus":focus,
    })

c.close()
print(json.dumps(out,separators=(",",":")))
`

function humanize(value: string) {
  return value.replace(/_/g, ' ').trim()
}

export async function getLatestLunaTelegramMessages(
  limit = 3,
): Promise<PublicLunaTelegramMessage[]> {
  try {
    const { stdout } = await execFileAsync('/usr/bin/python3', ['-c', PYTHON, DB_PATH], {
      timeout: 1500,
      maxBuffer: 32 * 1024,
    })

    const parsed = JSON.parse(stdout.trim()) as Array<{
      kind?: string
      severity?: string
      pattern?: string
      observations?: number
      confidence?: number
      deliveredAt?: string
      scanFocus?: string
    }>

    if (!Array.isArray(parsed)) return []

    return parsed.slice(0, Math.max(1, Math.min(limit, 3))).flatMap((item) => {
      if (!item?.deliveredAt) return []

      const kind = item.kind || 'ALERT'
      const severity = item.severity || 'unknown'
      const pattern = item.pattern || 'anomaly'
      const observations = Number(item.observations || 0)
      const confidence = Number(item.confidence || 0)
      const title = kind === 'SUBNET_SCAN'
        ? 'Subnet scan correlation'
        : 'Behavioral anomaly'

      return [{
        kind,
        severity,
        pattern,
        observations,
        confidence,
        deliveredAt: item.deliveredAt,
        title,
        scanFocus: item.scanFocus || humanize(pattern),
        text: `${humanize(pattern)} · ${observations} observations · confidence ${confidence.toFixed(2)}`,
      }]
    })
  } catch {
    return []
  }
}
