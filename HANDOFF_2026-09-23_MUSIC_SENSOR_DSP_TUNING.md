# HANDOFF — Music Sensor / Android Hub Live DSP tuning
Date: 2026-09-23
Repo: /home/ubuntu/n8n2erpnext/thaiduy.digital
Branch: main
Authoritative continuation point for the next session.

## 0. Read this first

This document is the current handoff for the Music Sensor / Android Hub work done on 2026-09-23.

The user is actively tuning the system with a known reference signal:

- 80 BPM
- Basic 2/4
- Drum only
- Android Hub DSP capture enabled

At handoff time the user has Android Hub **0.5.6 installed** and is still playing that exact reference loop.

The repo itself already contains a newer **0.5.7 release**. The next session should **not change visual amp or renderer first**. First ask the user to install 0.5.7, then re-measure the exact same 80 BPM / 2/4 / drum-only source.

Current repo HEAD:
- 9039354c release: add Android Hub 0.5.7

Recent relevant commits:
- 9039354c release: add Android Hub 0.5.7
- 78079cea ci: persist Android Hub build result [skip ci]
- 0cdc45ce tune: prefer stable autocorrelation tempo
- 1edf00cb release: add Android Hub 0.5.6
- 056192e3 ci: persist Android Hub build result [skip ci]
- 5817c2b8 tune: increase rhythm envelope resolution
- 93523735 release: add Android Hub 0.5.5 diagnostics
- 1ae77e13 ci: persist Android Hub build result [skip ci]
- fb9a7b62 chore: expose DSP tempo diagnostics
- ac414f9c release: add Android Hub 0.5.4
- 9bb04a48 ci: persist Android Hub build result [skip ci]
- 9edd5dbd tune: cross-check tempo with onset intervals

At handoff:
- main == origin/main
- worktree clean
- bun dev / Next dev is listening on port 3000
- local site is alive
- Android Hub 0.5.7 CI was successful
- signed 0.5.7 APK is already committed to the repo

Signed 0.5.7 APK:
- artifacts/android/thaiduy-hub-0.5.7-release.apk
- SHA-256: c59f681b456ee8609216be328cf6dc0d466462ea9a768e036d2c942798c92d2d
- release signing certificate is unchanged from prior releases:
  SHA-256 3841c39b2fe3b27bb5a836e9a55b7723f72160ae1e0e05c8d51050f336720eb0

GitHub CI runs for the 0.5.7 source commit 0cdc45ce:
- Android Hub V2: 35848752433 — SUCCESS
- Android Hub: 35848752538 — SUCCESS

## 1. Final product model agreed with owner

There are two completely different operating modes.

### 1.1 No audible DSP input from Android

Use LastFM / semantic mode.

Reason:
- there is no real acoustic signal
- no real band envelopes / waveform motion exists

Therefore LastFM mode is allowed to:
- read artist/title/tags
- infer genre/style/mood
- choose a procedural visual preset/archetype
- simulate wave motion using sine/procedural geometry

This is intentional and should remain unchanged.

### 1.2 Audible DSP input from Android

Use Live DSP mode.

The rules are strict:
- DSP is the sole acoustic/visual authority
- do not blend LastFM semantic tags into the DSP decision
- do not use LastFM genre/style/archetype to drive the live waves
- do not draw raw DSP values like an oscilloscope
- do not try to identify title/artist from spectral DSP
- Android local metadata is used if Android can obtain it

The Live DSP visual grammar should look like the good LastFM waves:
- smooth sine-like carriers
- multiple distinct bass / low-mid / mid / vocal / presence / air waves
- soft connected arcs
- common baseline behavior
- visually expressive, not raw analog/digital telemetry

But the wave motion is controlled by real DSP:
- band level -> visual gain/amplitude
- RMS -> total opening
- tempo/beat -> carrier speed/motion
- spectral flux / temporal slope -> attack / phase movement
- harmonic/percussive -> roundness / sharpness
- dynamic range -> expansion
- relative climax -> small crest resonance around the DSP-controlled sine carrier

In short:

LastFM:
metadata -> genre/style preset -> simulated waves

Live DSP:
audio -> DSP -> amplifier/envelope -> neutral sine carrier waves

Never:
LastFM preset + DSP modulation

## 2. Source arbiter: current behavior

Server-side DSP authority is implemented in:
- src/brains/music-sensor/live-signal.ts
- src/app/api/music/state/route.ts

Important constants / behavior:
- Redis signal TTL: 15 s
- audible DSP threshold:
  - rms >= 0.025 OR
  - peak >= 0.05
- latest audible frame is retained separately
- DSP HOT = current audible signal
- DSP GRACE = last audible signal retained for short network interruption
- DSP LOST = no authoritative audible frame; semantic/LastFM may take over

Browser-side protection is implemented in:
- src/hooks/use-music-state.ts

Current constants:
- DSP_VISUAL_DELAY_MS = 900
- DSP_BUFFER_KEEP_MS = 2800
- DSP_FALLBACK_GRACE_MS = 10000

Important:
- silent DSP frames are kept so visual amplitude can fall naturally
- silent frames do not indefinitely block semantic fallback
- after >10 s without audible DSP, semantic state can take over

When DSP is authoritative:
- public state genre = null
- style = null
- arrangement = null
- LastFM tags are not used in the DSP acoustic decision
- semantic memory is not injected into DSP analysis

## 3. Android DSP V2 capabilities

Primary Android files:
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/DspEngine.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/CaptureService.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/ApiClient.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/ScrobbleService.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/PlaybackSignal.kt

Android captures PCM locally with AudioPlaybackCapture.
Raw PCM is NOT streamed to the server.

The app sends compact DSP frames.

Current DSP features include:
- rms
- peak
- bass
- lowMid
- mid
- presence
- air
- spectralFlux
- spectralCentroid
- spectralFlatness
- zeroCrossingRate
- vocalProbability
- tempoBpm
- beatConfidence
- meter
- swingness
- percussiveProbability
- harmonicProbability
- dynamicRange

Current diagnostics also sent:
- tempoAutocorrBpm
- tempoOnsetBpm
- processIntervalMs

Those diagnostics are intentionally retained for live tuning.

Server ingest:
- src/app/api/music/sensor/ingest/route.ts

Frame model:
- src/brains/music-sensor/live-signal.ts

## 4. Live DSP renderer

Main file:
- src/lib/music-live-dsp-wave.ts

Consumers:
- src/components/living/music-organ.tsx
- src/components/living/music-wave-indicator.tsx

The renderer is NOT raw timeline geometry anymore.

It is an amplified sine-carrier renderer.

Neutral carrier properties are fixed per layer:
- bass
- lowMid
- mid
- vocal
- presence
- air

They are not genre presets.

DSP controls the carrier.

Current web-side band amplifier ranges:

- bass: floor .38, ceiling .98, trim .94
- lowMid: floor .30, ceiling .95, trim .98
- mid: floor .22, ceiling .90, trim 1.00
- vocal: floor .22, ceiling .90, trim 1.03
- presence: floor .14, ceiling .80, trim 1.02
- air: floor .08, ceiling .72, trim .98

Current gain curve:

- sourceLevel normalized per band
- amplified = sourceLevel ^ .72
- energyAmp = normalized RMS ^ .76
- gain ~= (amplified * (.54 + energyAmp * .34) + dynamic * .04) * trim

Do NOT change this immediately in the next session.

The user explicitly asked to tune slowly, one variable at a time.

Latest drum-only geometry after the first sensitivity reduction was approximately:
- bass gain ~0.245
- low-mid ~0.072
- mid ~0.107
- vocal ~0.039
- presence ~0.25
- air ~0.15

That was considered much more reasonable than the earlier overly sensitive state.

The current focus is tempo, not amplifier gain.

## 5. Vocal false-positive tuning

The drum-only reference originally produced false vocal estimates around 0.47-0.70.

Server fallback vocal estimator in:
- src/brains/music-sensor/live-signal.ts

It was changed so that:
- mid/presence must have relative prominence over bass
- high transient flux adds a small penalty
- bass-heavy/percussive sources no longer open vocal almost as strongly as bass

After tuning on drum-only:
- median vocal was around 0.15-0.17 in later tests
- many frames were around 0.06-0.10

On 0.5.6 measurement:
- p25 vocal ~0.068
- p50 ~0.092
- p75 ~0.252
- p90 ~0.296

Do not aggressively tune vocal again before checking new data.

## 6. Metadata / title / artist

Owner wants Android local title/artist displayed in Live DSP mode.

Correct rule:
- if Android has title/artist locally, show it
- do not use LastFM to fake title while DSP is authoritative
- DSP spectral features themselves cannot identify a recording title

Android metadata paths already implemented:
- MediaSession
- media notification fallback in ScrobbleService

Problem:
- on the Pixel used for testing, Notification Listener / related metadata access has been blocked by Android
- therefore server playback metadata has frequently been null
- AudioPlaybackCapture contains audio/UID, not title/artist

Web UX was corrected:
- when DSP is active but metadata is missing, UI says:
  "Live DSP · Android metadata unavailable"
- it no longer incorrectly says "No active playback"

This is still an open product issue.
Do not solve it by pulling LastFM metadata into Live DSP mode unless owner explicitly changes the rule.

## 7. Android version tuning history

### 0.5.1

Changes:
- tempo harmonic disambiguation
- peak normalization headroom
- notification metadata fallback
- day-mode live glow fix
- wave visual refinements

Observed problem:
- tempo still wrong on known reference sources

### 0.5.2

Intended:
- real process cadence
- 2/4 meter

There was a race during build/rebase and the tempo cadence patch was not reliably present in the built artifact.

Do NOT use 0.5.2 as evidence for the estimator.

### 0.5.3

Included:
- measured process interval
- conservative 2/4 meter candidate

Reference test:
80 BPM / Basic 2/4 / Drum only

Observed:
- meter: 32/36 = 2/4
- tempo remained ~110 BPM
- beat confidence ~0.55-0.65

Conclusion:
- timing cadence was not the only problem
- estimator was selecting a wrong pulse/subdivision

### 0.5.4

Added:
- second tempo estimator based on onset peak intervals
- autocorrelation retained as another evidence source

Same 80 BPM / 2/4 drum-only reference:

Observed:
- meter: 39/39 = 2/4
- final tempo ~87.9 BPM
- beat confidence ~0.85

This was an improvement:
- 110 -> 87.9
- but still ~10% fast

No arbitrary 0.91 correction factor was added.

### 0.5.5 diagnostics

Added frame diagnostics:
- tempoAutocorrBpm
- tempoOnsetBpm
- processIntervalMs

On the 80 BPM drum-only reference:

Observed:
- processInterval ~85.3 ms
- autocorrelation ~55 BPM
- onset ~87.9 BPM

Conclusion:
- Android process timing itself was correct
- tempo quantization / estimator resolution was the issue

### 0.5.6 — currently installed on user's phone at handoff

Change:
- rhythm envelope resolution increased 4x
- each FFT 4096 window remains intact for spectral/band analysis
- rhythm analysis derives four sub-window energy buckets
- tempo/meter estimator runs at ~21 ms rhythm resolution instead of ~85 ms

Very important measurement on the same known source:

Reference:
- 80 BPM
- Basic 2/4
- Drum only

0.5.6 diagnostic sample:
- 39 unique frames
- DSP authority = hot
- processInterval:
  - p50 85.302 ms
- tempoAutocorrBpm:
  - p50 80.386 BPM
  - min 80.226
  - max 80.617
- tempoOnsetBpm:
  - p50 88.101
  - later frames often ~117 BPM
- final tempo:
  - p50 84.338
  - later drifted upward:
    ~84.9 -> 86.7 -> 88.4 -> 90.2 -> 91.9 -> 93.7 -> 95.5 -> 97.3 -> 99.0 -> 100.7 -> 102.5 -> 104.3 -> 106.0
- beat confidence:
  - p50 ~0.767
- meter:
  - 28 frames 4/4
  - 11 frames 2/4
- vocal:
  - p50 ~0.092
- percussive:
  - p50 ~0.308
- harmonic:
  - p50 ~0.645

Critical conclusion:

The 4x rhythm envelope solved the main resolution problem.

Autocorrelation on 0.5.6 is now almost perfectly correct:
- ~80.3 BPM on a true 80 BPM source

Onset estimator is the wrong source on this test:
- ~88 or ~117 due subdivision

The final tempo drifted upward only because the arbiter still allowed the wrong onset estimator to override a stable autocorrelation result.

### 0.5.7 — built and released, NOT yet installed by user at handoff

Source commit:
- 0cdc45ce tune: prefer stable autocorrelation tempo

Release HEAD:
- 9039354c release: add Android Hub 0.5.7

Change:
- stable autocorrelation is now the primary tempo source
- onset tempo is only blended when:
  - the two estimates are close (<12 BPM), or
  - they are a clear half/double octave relationship and onset confidence is materially stronger
- unrelated onset values such as 117 BPM are NOT allowed to pull a stable ~80 BPM autocorrelation result upward
- previous final tempo is only blended when the new candidate is already close

Current tempo arbiter logic is in:
- DspEngine.kt around the candidateBpm / peakBpm section

Expected next result on the reference source:
- tempoAutocorrBpm should remain ~80.3
- tempoOnsetBpm may remain ~117 and that is acceptable
- final tempoBpm should remain near autocorrelation, ideally ~80-82
- no upward drift toward 100+
- meter may still oscillate and should be tuned only AFTER tempo is stable

0.5.7 release APK:
- artifacts/android/thaiduy-hub-0.5.7-release.apk
- SHA-256 c59f681b456ee8609216be328cf6dc0d466462ea9a768e036d2c942798c92d2d

## 8. Exact next-session procedure

Do these steps in this order.

### Step A — do not edit code yet

Confirm:
- repo is clean
- main == origin/main
- bun dev is still on port 3000

### Step B — user installs 0.5.7

The user currently has 0.5.6 installed.

Have user install:
- artifacts/android/thaiduy-hub-0.5.7-release.apk

Do not ask them to change the test source.

Keep:
- 80 BPM
- Basic 2/4
- Drum only
- DSP enabled

### Step C — measure before changing anything

Capture ~15-20 seconds of unique DSP frames.

Inspect:
- tempoBpm
- tempoAutocorrBpm
- tempoOnsetBpm
- processIntervalMs
- beatConfidence
- meter
- rms
- peak
- spectralFlux
- percussiveProbability
- harmonicProbability
- vocalProbability

Expected if 0.5.7 works:
- autocorr ~80.3
- final tempo ~80-82
- onset may be ~117
- process interval ~85.3 ms
- final tempo must NOT drift from 80 toward 100+

### Step D — only then decide what to tune

If final BPM is now correct:
1. freeze tempo code
2. tune meter next
3. then tune percussive/harmonic
4. only then revisit visual amp if owner sees a real issue

If final BPM is still wrong:
- do not touch amp
- do not touch LastFM renderer
- inspect the arbiter diagnostics first
- preserve autocorr/onset/process diagnostics

### Step E — meter target

Known source is Basic 2/4.

0.5.3/0.5.4 could detect 2/4 strongly.
0.5.6 high-resolution rhythm made meter alternate 4/4 and 2/4.

Do NOT tune meter before verifying 0.5.7 final BPM.

Likely next meter work:
- inspect corr2 / corr3 / corr4 as diagnostics
- avoid simply lowering thresholds
- distinguish 2/4 vs 4/4 using accent periodicity, not just repeated beat correlation

## 9. Test philosophy

Owner wants slow live tuning.

Rules:
- tune one variable at a time
- use known reference audio
- measure before editing
- do not overfit by multiplying BPM by a magic correction factor
- do not train from Sensor's own predictions
- do not change amplifier while tempo is the active known bug
- keep unknown when evidence is insufficient
- prefer deterministic diagnostics to guessing

Useful reference tests already used:
- 80 BPM Basic 2/4 Drum only

Future reference set should add:
- 60 BPM simple 4/4 kick
- 100 BPM simple 4/4
- 120 BPM metronome
- 140 BPM drum-only
- simple 3/4
- simple 6/8
- vocal-only / speech-like music segment
- bass-only / kick-only
- melodic harmonic-only sample

Do not broaden the reference set until 80 BPM / 2/4 is stable.

## 10. Current quality/status summary

Source authority:
- PASS conceptually
- DSP HOT/GRACE and LastFM fallback are separated

Live visual architecture:
- PASS conceptually
- sine carrier + DSP amplifier/envelope
- no raw oscilloscope renderer
- no LastFM preset influence while DSP is live

Live amplifier:
- currently acceptable for the drum-only tuning stage
- do not retune first next session

Vocal false positive:
- significantly improved
- continue observing after tempo/meter are stable

Tempo:
- 0.5.6 autocorrelation is correct ~80.3 on true 80 BPM source
- 0.5.6 final arbiter was wrong because onset override pulled it upward
- 0.5.7 specifically fixes that arbiter
- 0.5.7 still needs live validation on the user's phone

Meter:
- not yet final
- oscillated 4/4 vs 2/4 in 0.5.6
- tune only after 0.5.7 tempo verification

Percussive/harmonic:
- still not semantically ideal for drum-only
- on 0.5.6 median percussive ~0.308, harmonic ~0.645
- this should eventually invert/improve for drum-only
- do not fix before tempo/meter validation

Title/artist metadata:
- unresolved because Android access is blocked/unavailable
- MediaSession + notification fallback code exists
- do not inject LastFM title into Live DSP mode

## 11. Important files

Android:
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/DspEngine.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/CaptureService.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/ApiClient.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/ScrobbleService.kt
- sensors/music/android/app/src/main/java/digital/thaiduy/hub/PlaybackSignal.kt
- sensors/music/android/app/build.gradle.kts

Android CI:
- .github/workflows/android-hub-v2.yml

Server DSP:
- src/app/api/music/sensor/ingest/route.ts
- src/app/api/music/state/route.ts
- src/app/api/music/stream/route.ts
- src/brains/music-sensor/live-signal.ts
- src/brains/music-sensor/playback-signal.ts
- src/brains/music-sensor/kernel.ts
- src/brains/music-sensor/knowledge.ts
- src/brains/music-sensor/service.ts
- src/brains/music-sensor/types.ts

Web visual:
- src/hooks/use-music-state.ts
- src/lib/music-live-dsp-wave.ts
- src/lib/music-wave-geometry.ts
- src/lib/music-expression.ts
- src/components/living/music-organ.tsx
- src/components/living/music-wave-indicator.tsx
- src/components/living/music-sensor-explorer.tsx

Tests:
- scripts/test-music-live-dsp.ts
- scripts/test-music-dsp-v2.ts
- scripts/test-music-k2.ts

## 12. Commands used for live inspection

Use the existing repo/Bun environment.

For runtime:
- check port 3000
- bun dev is expected to stay alive

For live frame analysis:
- import getLatestMusicDspFrame and getMusicDspAuthority from src/brains/music-sensor/live-signal.ts
- dedupe by frame.seq
- sample for 15-20 seconds
- summarize p25/p50/p75/p90 rather than relying on one frame

For known-source tempo tuning always inspect all of:
- tempoBpm
- tempoAutocorrBpm
- tempoOnsetBpm
- processIntervalMs
- beatConfidence
- meter

Do not infer correctness only from public /api/music/state.

## 13. Build / release discipline

Android releases are built by GitHub Actions and then signed with the existing release key.

Do not rotate the signing key.

Current signer certificate SHA-256:
- 3841c39b2fe3b27bb5a836e9a55b7723f72160ae1e0e05c8d51050f336720eb0

Recent versions:
- 0.5.4: onset interval cross-check
- 0.5.5: diagnostics
- 0.5.6: 4x rhythm envelope
- 0.5.7: stable autocorrelation tempo arbiter

When changing Android behavior:
1. bump versionCode/versionName
2. update Android Hub V2 workflow aligned APK name
3. commit/push main
4. wait for CI success
5. download aligned release artifact
6. sign with existing release key
7. verify certificate
8. place signed APK in artifacts/android/
9. commit/push release artifact

## 14. Do-not-regress list

Do not:
- merge LastFM tags into Live DSP analysis
- use genre to shape Live DSP waves
- return to raw oscilloscope-style DSP visualization
- make silent DSP frames block LastFM forever
- remove the 10 s fallback grace without a reason
- remove tempo diagnostics before the known reference tests are stable
- train genre/instrument models from Sensor self-predictions
- fake title/artist from LastFM while DSP is authoritative
- make large amplifier changes while tempo/meter are the active tuning target
- force-push main
- rotate Android signing cert
- treat 0.5.2 as reliable tempo evidence

## 15. Immediate next message / action

At handoff, user last said they had installed 0.5.6 and were still playing:

80 BPM · Basic 2/4 · Drum only

The next session should begin with:

1. tell user 0.5.7 is ready and ask them to install it
2. keep exactly the same reference loop playing
3. capture 15-20 seconds of diagnostics
4. verify final tempo stays near the stable ~80.3 autocorrelation estimate
5. do not change amp unless user specifically reports a visual problem after tempo validation

This is the authoritative continuation point.

## 2026-09-23 · DSP tuning evidence update (0.5.11 → 0.5.16)

### Stable references
- 0.5.13 · 80 BPM 2/4: clean steady-state tempo ~80.3 BPM. Reliability hysteresis improved from frame flicker. End-of-window meter mostly 2/4; keep as regression reference.
- 0.5.14 · 120 BPM 4/4 drum: octave/half-time arbiter fixed. Autocorr stayed ~59.85 but onset ~117.2 won, final ~117.2. Meter still misclassified 2/4.
- 0.5.15 · meter local lag ±1 did not solve 4/4. Both lag 23/24 can still produce 2/4. Root cause is not just tempo-derived lag quantization.
- 0.5.16 diagnostic: added meterOppositeAsymmetry4. 120 BPM 4/4 drum reference: tempo median ~117.19; corr4 median ~0.377 > corr2 ~0.309; accent2 median ~0.564 >> accent4 ~0.082; opposite4 median ~0.168 (P75 ~0.287, P90 ~0.320). Broadband strong/weak alternation is causing 4/4 to look like 2/4.

### Full-song references
- Hero — Enrique Iglesias (0.5.16): DSP authority HOT throughout measurement. Full mix harmonic median ~0.783, percussive ~0.365. vocalProbability median ~0.346 (P75 ~0.441, max ~0.566): likely under-detecting voice-in-mix after violin/piano false-positive tightening. Tempo/meter low confidence; mostly unknown.
- Billie Jean — Michael Jackson (0.5.16): DSP authority HOT throughout. Autocorr tempo extremely stable around 117.2 BPM with autocorr confidence 1.0, final ~116.88 BPM, yet tempoReliable 0/41 and meter unknown 41/41 because the timbre/pulse reliability gate suppresses a genuinely stable full-song groove. vocalProbability median ~0.344 (P90 ~0.415, max ~0.451), independently confirming under-detection of voice-in-mix.
- Important observability bug: when tempoReliable=false, updateRhythm returns before recomputing meter diagnostics; corr/accent/opposite4 fields can remain stale. Future diagnostic refactor should compute diagnostics even when public meter stays unknown.

### Capture integrity / possible distortion
- CaptureService uses Android AudioPlaybackCapture -> PCM_16BIT, 48 kHz, stereo, selected source UIDs.
- Raw PCM stays on device. ApiClient sends derived DspFeatures only; no raw audio is network-streamed.
- DspEngine currently downmixes stereo with (L + R) / 2 before RMS, rhythm, FFT and band analysis. Out-of-phase stereo content can therefore cancel and alter analysis features even if source PCM is clean.
- rms/peak/band values are dB-mapped/clamped 0..1 features. A displayed value near 1.0 is not by itself proof of clipping. bandLevel=1 can simply be feature-scale saturation.
- Tempo/meter are calculated locally before the 100 ms feature upload cadence, so network cadence cannot cause the main tempo-estimator errors observed above.
- Recommended capture-integrity diagnostics before further classifier tuning: raw left/right RMS, raw mono RMS, raw peak dBFS, near-full-scale clip fraction, stereo correlation, and mono-cancellation ratio. Use diagnostics first; do not alter wave/amp or classifier behavior based on suspected capture distortion without evidence.

### 0.6.0 server-DSP migration validation · Billie Jean
- Android hot path is now capture -> AAC-LC 128 kbps / 48 kHz stereo -> HTTPS; DspEngine.process() is no longer called on Android.
- Server worker decodes AAC with ffmpeg, keeps a 30 s PCM ring buffer in RAM only, runs TypeScript DSP, and publishes normal MusicDspFrame output.
- Transport validation: 5 s AAC -> 5.035 s decoded PCM with ffmpeg probe size 2048 and analyzeduration 0; earlier nobuffer configuration was proven to drop about 1 s from a 5 s sample and was removed.
- Live Billie Jean measurement: 86/86 sampled frames had transport=server-aac and DSP authority stayed HOT throughout.
- Capture integrity on Billie Jean: raw L/R RMS roughly balanced; raw mono RMS median ~-12.39 dBFS; raw peak median ~-2.02 dBFS; clip fraction median 0, occasional short peaks up to ~0.22%; stereo correlation median ~0.948; mono-cancellation median ~1.38%, with occasional wide-stereo windows up to ~22%.
- Conclusion: source/network transport is not the main cause of tempo/meter errors. Stereo downmix can lose information in isolated wide-phase windows, but the overall capture is healthy and server now retains original L/R for future analysis.
- Baseline server tempo initially reproduced ~117.19 BPM autocorr cleanly but reliability remained too conservative.
- Experimental server-only reliability patch increased beatConfidence/reliability but exposed unstable harmonic selection; a guarded low-BPM double rule then caused additional 187.5 BPM harmonic errors. Both experimental patches were rolled back before commit.
- 30 s ring-buffer spectrum showed multiple strong periodicities in full-song material (including ~187.5, ~127.8, ~122.3, ~93.75, ~76 BPM depending on section). This confirms that single-best-lag autocorrelation is structurally insufficient for full-song tempo tracking.
- Next tempo direction: multi-candidate / multi-window consensus with harmonic-family scoring and continuity, using the server ring buffer for replay. Do not add more one-off tempo thresholds.
