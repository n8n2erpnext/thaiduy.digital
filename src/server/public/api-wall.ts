import 'server-only'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const LOG_PATH =
  process.env.PUBLIC_API_WALL_LOG ||
  '/home/ubuntu/proxy_logs/access.log'

export type PublicApiWallEvent = {
  at: string
  method: string
  path: string
  status: number
  durationMs: number
}

const PYTHON = String.raw`
import json, os, re, sys

path=sys.argv[1]
limit=max(1,min(int(sys.argv[2]),5))
safe={
  "/api/music/state",
  "/api/stack/live",
  "/api/stack/organism",
  "/api/entity/stream",
}

try:
  size=os.path.getsize(path)
  tail=min(size,768*1024)
  with open(path,"rb") as f:
    f.seek(max(0,size-tail))
    raw=f.read().decode("utf-8","ignore")
except Exception:
  print("[]")
  raise SystemExit(0)

events=[]
for line in reversed(raw.splitlines()):
  if len(events)>=limit:
    break
  if "host=thaiduy.digital" not in line:
    continue

  ts=re.match(r"^(\d{4}-\d{2}-\d{2}T[^\s]+)",line)
  method=re.search(r"\bmethod=([^\s]+)",line)
  route=re.search(r"\bpath=([^\s]+)",line)
  status=re.search(r"\bstatus=(\d{3})",line)
  duration=re.search(r"\bduration=([0-9.]+)(ms|s)?",line)

  if not all((ts,method,route,status,duration)):
    continue

  clean_path=route.group(1).strip("'\"").split("?",1)[0]
  if clean_path not in safe:
    continue

  value=float(duration.group(1))
  if duration.group(2)=="s":
    value*=1000

  events.append({
    "at":ts.group(1),
    "method":method.group(1).strip("'\"").upper(),
    "path":clean_path,
    "status":int(status.group(1)),
    "durationMs":round(value),
  })

print(json.dumps(events,separators=(",",":")))
`

export async function getPublicApiWall(limit = 3): Promise<PublicApiWallEvent[]> {
  try {
    const safeLimit=Math.max(1,Math.min(limit,5))
    const { stdout } = await execFileAsync(
      '/usr/bin/python3',
      ['-c',PYTHON,LOG_PATH,String(safeLimit)],
      { timeout:1500, maxBuffer:32*1024 },
    )

    const parsed=JSON.parse(stdout.trim()) as PublicApiWallEvent[]
    return Array.isArray(parsed) ? parsed.slice(0,safeLimit) : []
  } catch {
    return []
  }
}
