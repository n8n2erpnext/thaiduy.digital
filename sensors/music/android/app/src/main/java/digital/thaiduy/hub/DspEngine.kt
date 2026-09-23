package digital.thaiduy.hub

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

data class DspFeatures(
    val rms: Float,
    val peak: Float,
    val bass: Float,
    val lowMid: Float,
    val mid: Float,
    val presence: Float,
    val air: Float,
    val spectralFlux: Float,
    val spectralCentroid: Float,
    val spectralFlatness: Float,
    val zeroCrossingRate: Float,
    val tempoBpm: Float,
    val tempoAutocorrBpm: Float,
    val tempoOnsetBpm: Float,
    val tempoReliable: Boolean,
    val tempoSource: String,
    val tempoAutocorrConfidence: Float,
    val tempoOnsetConfidence: Float,
    val processIntervalMs: Float,
    val beatConfidence: Float,
    val meter: String,
    val meterCorr2: Float,
    val meterCorr3: Float,
    val meterCorr4: Float,
    val meterAccent2: Float,
    val meterAccent3: Float,
    val meterAccent4: Float,
    val meterConfidence: Float,
    val meterBeatLag: Int,
    val subdivisionSimple: Float,
    val subdivisionTriplet: Float,
    val swingness: Float,
    val percussiveProbability: Float,
    val harmonicProbability: Float,
    val dynamicRange: Float,
)

class DspEngine(
    private val sampleRate: Int = 48_000,
    private val fftSize: Int = 4_096,
) {
    private val previousSpectrum = FloatArray(fftSize / 2 + 1)
    private val onsetHistory = FloatArray(160)
    private val energyHistory = FloatArray(160)
    private val rhythmOnsetHistory = FloatArray(512)
    private val rhythmEnergyHistory = FloatArray(512)
    private var rhythmHistoryCount = 0
    private var rhythmHistoryIndex = 0
    private var previousRhythmEnergy = 0f
    private val processIntervalHistory = FloatArray(64)
    private var processIntervalCount = 0
    private var processIntervalIndex = 0
    private var lastProcessNs = 0L
    private var historyCount = 0
    private var historyIndex = 0
    private var fluxBaseline = 0f
    private var processCount = 0L

    private var tempoBpm = 0f
    private var tempoAutocorrBpm = 0f
    private var tempoOnsetBpm = 0f
    private var tempoReliable = false
    private var tempoSource = "unknown"
    private var tempoAutocorrConfidence = 0f
    private var tempoOnsetConfidence = 0f
    private val tempoAutocorrHistory = FloatArray(8)
    private val tempoOnsetHistory = FloatArray(8)
    private val tempoAutocorrConfidenceHistory = FloatArray(8)
    private val tempoOnsetConfidenceHistory = FloatArray(8)
    private var tempoHistoryCount = 0
    private var tempoHistoryIndex = 0
    private var pendingTempoBpm = 0f
    private var pendingTempoCount = 0
    private var tempoReliabilityHold = 0
    private var latestPercussive = 0f
    private var latestHarmonic = 0f
    private var beatConfidence = 0f
    private var meter = "unknown"
    private var meterCorr2 = 0f
    private var meterCorr3 = 0f
    private var meterCorr4 = 0f
    private var meterAccent2 = 0f
    private var meterAccent3 = 0f
    private var meterAccent4 = 0f
    private var meterConfidence = 0f
    private var meterBeatLag = 0
    private var subdivisionSimple = 0f
    private var subdivisionTriplet = 0f
    private var swingness = 0f

    fun process(interleaved: ShortArray, count: Int, channels: Int = 2): DspFeatures {
        recordProcessInterval()
        val re = FloatArray(fftSize)
        val im = FloatArray(fftSize)
        val frames = minOf(count / channels, fftSize)
        val rhythmSums = DoubleArray(4)
        val rhythmCounts = IntArray(4)
        var rmsSum = 0.0
        var peak = 0f
        var zeroCrossings = 0
        var previousSample = 0f

        for (i in 0 until frames) {
            var mixed = 0f
            for (channel in 0 until channels) {
                mixed += interleaved[i * channels + channel] / 32768f
            }
            mixed /= channels.toFloat()
            rmsSum += mixed * mixed
            val rhythmBucket = minOf(3, (i * 4) / frames.coerceAtLeast(1))
            rhythmSums[rhythmBucket] += mixed * mixed
            rhythmCounts[rhythmBucket] += 1
            peak = max(peak, kotlin.math.abs(mixed))
            if (i > 0 && ((mixed >= 0f) != (previousSample >= 0f))) zeroCrossings += 1
            previousSample = mixed

            val window = (0.5 - 0.5 * cos(2.0 * PI * i / (fftSize - 1))).toFloat()
            re[i] = mixed * window
        }

        fft(re, im)
        val magnitudes = FloatArray(fftSize / 2 + 1)

        var magnitudeSum = 0.0
        var weightedFrequency = 0.0
        var logMagnitudeSum = 0.0
        var flatnessMagnitudeSum = 0.0
        var flatnessBins = 0
        for (bin in magnitudes.indices) {
            val magnitude = sqrt(re[bin] * re[bin] + im[bin] * im[bin]) / (fftSize / 2f)
            magnitudes[bin] = magnitude
            val frequency = bin * sampleRate.toDouble() / fftSize
            magnitudeSum += magnitude
            weightedFrequency += frequency * magnitude

            if (frequency in 20.0..16_000.0) {
                logMagnitudeSum += ln(magnitude.toDouble() + 1e-12)
                flatnessMagnitudeSum += magnitude
                flatnessBins += 1
            }
        }

        var rawFlux = 0.0
        val normDenom = magnitudeSum.coerceAtLeast(1e-12)
        for (bin in magnitudes.indices) {
            val normalized = (magnitudes[bin] / normDenom).toFloat()
            rawFlux += max(0f, normalized - previousSpectrum[bin])
            previousSpectrum[bin] = normalized
        }

        val rawRms = sqrt(rmsSum / frames.coerceAtLeast(1))
        val rms = amplitudeLevel(rawRms)
        val peakLevel = peakAmplitudeLevel(peak.toDouble())
        val bass = bandLevel(magnitudes, 20.0, 180.0)
        val lowMid = bandLevel(magnitudes, 180.0, 800.0)
        val mid = bandLevel(magnitudes, 800.0, 2_000.0)
        val presence = bandLevel(magnitudes, 2_000.0, 6_000.0)
        val air = bandLevel(magnitudes, 6_000.0, 16_000.0)

        val currentFlux = rawFlux.toFloat()
        fluxBaseline = if (fluxBaseline <= 1e-6f) {
            currentFlux.coerceAtLeast(1e-5f)
        } else {
            fluxBaseline * 0.94f + currentFlux * 0.06f
        }
        val spectralFlux = if (rawRms < 1e-5) {
            0f
        } else {
            (currentFlux / (fluxBaseline * 3.0f + 1e-6f)).coerceIn(0f, 1f)
        }

        val arithmeticMean = if (flatnessBins > 0) {
            flatnessMagnitudeSum / flatnessBins
        } else 0.0
        val geometricMean = if (flatnessBins > 0) {
            exp(logMagnitudeSum / flatnessBins)
        } else 0.0
        val spectralFlatness = if (arithmeticMean > 1e-12) {
            (geometricMean / arithmeticMean).toFloat().coerceIn(0f, 1f)
        } else 0f

        val zeroCrossingRate = if (frames > 1) {
            zeroCrossings.toFloat() / (frames - 1).toFloat()
        } else 0f
        val zcrShape = (zeroCrossingRate * 4f).coerceIn(0f, 1f)

        val percussive = (
            spectralFlux * 0.42f +
                zcrShape * 0.22f +
                spectralFlatness * 0.18f +
                presence * 0.10f +
                bass * 0.08f
            ).coerceIn(0f, 1f)

        val harmonic = (
            (1f - spectralFlatness) * 0.42f +
                ((lowMid + mid) * 0.5f) * 0.28f +
                (1f - percussive) * 0.16f +
                (1f - zcrShape) * 0.14f
            ).coerceIn(0f, 1f)

        latestPercussive = percussive
        latestHarmonic = harmonic

        appendRhythmSubwindows(rhythmSums, rhythmCounts)
        appendHistory(spectralFlux, rms)
        processCount += 1
        if (processCount % 6L == 0L && rhythmHistoryCount >= 96) {
            updateRhythm()
        }

        val dynamicRange = dynamicRange()

        return DspFeatures(
            rms = rms,
            peak = peakLevel,
            bass = bass,
            lowMid = lowMid,
            mid = mid,
            presence = presence,
            air = air,
            spectralFlux = spectralFlux,
            spectralCentroid = if (magnitudeSum > 1e-12) {
                (weightedFrequency / magnitudeSum).toFloat()
            } else 0f,
            spectralFlatness = spectralFlatness,
            zeroCrossingRate = zeroCrossingRate,
            tempoBpm = tempoBpm,
            tempoAutocorrBpm = tempoAutocorrBpm,
            tempoOnsetBpm = tempoOnsetBpm,
            tempoReliable = tempoReliable,
            tempoSource = tempoSource,
            tempoAutocorrConfidence = tempoAutocorrConfidence,
            tempoOnsetConfidence = tempoOnsetConfidence,
            processIntervalMs = (measuredProcessIntervalSeconds() * 1_000.0).toFloat(),
            beatConfidence = beatConfidence,
            meter = meter,
            meterCorr2 = meterCorr2,
            meterCorr3 = meterCorr3,
            meterCorr4 = meterCorr4,
            meterAccent2 = meterAccent2,
            meterAccent3 = meterAccent3,
            meterAccent4 = meterAccent4,
            meterConfidence = meterConfidence,
            meterBeatLag = meterBeatLag,
            subdivisionSimple = subdivisionSimple,
            subdivisionTriplet = subdivisionTriplet,
            swingness = swingness,
            percussiveProbability = percussive,
            harmonicProbability = harmonic,
            dynamicRange = dynamicRange,
        )
    }

    private fun recordProcessInterval() {
        val now = System.nanoTime()
        if (lastProcessNs != 0L) {
            val seconds = (now - lastProcessNs) / 1_000_000_000f
            if (seconds in 0.03f..0.25f) {
                processIntervalHistory[processIntervalIndex] = seconds
                processIntervalIndex = (processIntervalIndex + 1) % processIntervalHistory.size
                processIntervalCount = minOf(processIntervalCount + 1, processIntervalHistory.size)
            }
        }
        lastProcessNs = now
    }

    private fun measuredProcessIntervalSeconds(): Double {
        if (processIntervalCount < 8) return fftSize.toDouble() / sampleRate.toDouble()
        val values = FloatArray(processIntervalCount)
        val start = if (processIntervalCount < processIntervalHistory.size) 0 else processIntervalIndex
        for (i in 0 until processIntervalCount) {
            values[i] = processIntervalHistory[(start + i) % processIntervalHistory.size]
        }
        values.sort()
        val mid = values.size / 2
        return if (values.size % 2 == 0) {
            ((values[mid - 1] + values[mid]) * 0.5f).toDouble()
        } else {
            values[mid].toDouble()
        }
    }

    private fun appendRhythmSubwindows(sums: DoubleArray, counts: IntArray) {
        for (index in sums.indices) {
            val energy = if (counts[index] > 0) {
                sqrt(sums[index] / counts[index]).toFloat()
            } else 0f
            val onset = maxOf(0f, energy - previousRhythmEnergy * 0.90f)
            previousRhythmEnergy = energy

            rhythmOnsetHistory[rhythmHistoryIndex] = onset
            rhythmEnergyHistory[rhythmHistoryIndex] = energy
            rhythmHistoryIndex = (rhythmHistoryIndex + 1) % rhythmOnsetHistory.size
            rhythmHistoryCount = minOf(rhythmHistoryCount + 1, rhythmOnsetHistory.size)
        }
    }

    private fun chronologicalRhythm(source: FloatArray): FloatArray {
        val size = rhythmHistoryCount
        val output = FloatArray(size)
        val start = if (rhythmHistoryCount < source.size) 0 else rhythmHistoryIndex
        for (i in 0 until size) {
            output[i] = source[(start + i) % source.size]
        }
        return output
    }

    private fun appendHistory(onset: Float, energy: Float) {
        onsetHistory[historyIndex] = onset
        energyHistory[historyIndex] = energy
        historyIndex = (historyIndex + 1) % onsetHistory.size
        historyCount = minOf(historyCount + 1, onsetHistory.size)
    }

    private fun chronological(source: FloatArray): FloatArray {
        val size = historyCount
        val output = FloatArray(size)
        val start = if (historyCount < source.size) 0 else historyIndex
        for (i in 0 until size) {
            output[i] = source[(start + i) % source.size]
        }
        return output
    }

    private fun correlation(values: FloatArray, lag: Int): Float {
        if (lag <= 0 || values.size <= lag + 6) return 0f
        val count = values.size - lag
        var meanA = 0.0
        var meanB = 0.0
        for (i in 0 until count) {
            meanA += values[i]
            meanB += values[i + lag]
        }
        meanA /= count
        meanB /= count

        var numerator = 0.0
        var denomA = 0.0
        var denomB = 0.0
        for (i in 0 until count) {
            val a = values[i] - meanA
            val b = values[i + lag] - meanB
            numerator += a * b
            denomA += a * a
            denomB += b * b
        }
        val denom = sqrt(denomA * denomB)
        if (denom <= 1e-9) return 0f
        return (numerator / denom).toFloat().coerceIn(-1f, 1f)
    }

    private fun median(values: List<Float>): Float {
        if (values.isEmpty()) return 0f
        val sorted = values.sorted()
        val mid = sorted.size / 2
        return if (sorted.size % 2 == 0) {
            (sorted[mid - 1] + sorted[mid]) * 0.5f
        } else sorted[mid]
    }

    private fun peakIntervalTempo(
        onset: FloatArray,
        secondsPerWindow: Double,
    ): Pair<Float, Float> {
        if (onset.size < 32) return 0f to 0f

        val sorted = onset.sorted()
        val medianOnset = if (sorted.size % 2 == 0) {
            (sorted[sorted.size / 2 - 1] + sorted[sorted.size / 2]) * 0.5f
        } else {
            sorted[sorted.size / 2]
        }
        val p75 = sorted[((sorted.size - 1) * 3) / 4]
        val threshold = medianOnset + (p75 - medianOnset) * 0.55f

        val peaks = mutableListOf<Int>()
        var lastPeak = -99
        for (i in 1 until onset.size - 1) {
            val isPeak = onset[i] >= threshold &&
                onset[i] >= onset[i - 1] &&
                onset[i] > onset[i + 1]
            if (!isPeak) continue

            if (i - lastPeak < 2) {
                if (peaks.isNotEmpty() && onset[i] > onset[peaks.last()]) {
                    peaks[peaks.lastIndex] = i
                    lastPeak = i
                }
                continue
            }
            peaks += i
            lastPeak = i
        }
        if (peaks.size < 4) return 0f to 0f

        val bpmCandidates = mutableListOf<Float>()
        for (i in 1 until peaks.size) {
            val interval = (peaks[i] - peaks[i - 1]) * secondsPerWindow
            if (interval <= 0.0) continue
            var bpm = (60.0 / interval).toFloat()
            while (bpm > 145f) bpm /= 2f
            while (bpm < 58f) bpm *= 2f
            if (bpm in 58f..145f) bpmCandidates += bpm
        }
        if (bpmCandidates.size < 3) return 0f to 0f

        val center = median(bpmCandidates)
        val close = bpmCandidates.filter { kotlin.math.abs(it - center) <= 10f }
        if (close.size < 3) return 0f to 0f

        val bpm = median(close)
        val spread = median(close.map { kotlin.math.abs(it - bpm) })
        val consistency = (1f - spread / 16f).coerceIn(0f, 1f)
        val coverage = (close.size.toFloat() / bpmCandidates.size.toFloat()).coerceIn(0f, 1f)
        val confidence = (consistency * 0.65f + coverage * 0.35f).coerceIn(0f, 1f)
        return bpm to confidence
    }

    private fun accentPeriodicity(values: FloatArray, beatLag: Int, beatsPerBar: Int): Float {
        if (beatLag <= 0 || beatsPerBar < 2) return 0f
        val beatCount = values.size / beatLag
        if (beatCount < beatsPerBar * 3) return 0f

        val usableBeats = minOf(beatCount, 24)
        val start = values.size - usableBeats * beatLag
        val beatEnergy = FloatArray(usableBeats)
        for (beat in 0 until usableBeats) {
            var sum = 0.0
            var peak = 0f
            val from = start + beat * beatLag
            val to = minOf(values.size, from + beatLag)
            for (i in from until to) {
                val value = values[i]
                sum += value
                if (value > peak) peak = value
            }
            val mean = if (to > from) (sum / (to - from)).toFloat() else 0f
            beatEnergy[beat] = mean * 0.45f + peak * 0.55f
        }

        val phaseSum = FloatArray(beatsPerBar)
        val phaseCount = IntArray(beatsPerBar)
        for (beat in beatEnergy.indices) {
            val phase = beat % beatsPerBar
            phaseSum[phase] += beatEnergy[beat]
            phaseCount[phase] += 1
        }
        val phaseMean = FloatArray(beatsPerBar) { phase ->
            if (phaseCount[phase] > 0) phaseSum[phase] / phaseCount[phase] else 0f
        }
        val overall = phaseMean.average().toFloat().coerceAtLeast(1e-5f)
        val sorted = phaseMean.sortedDescending()

        return if (beatsPerBar == 2) {
            (kotlin.math.abs(phaseMean[0] - phaseMean[1]) / overall).coerceIn(0f, 1f)
        } else {
            // 3/4 and 4/4 need a distinct downbeat. A 2-beat strong/weak pattern
            // mapped into 4 phases produces two similarly strong phases, so the
            // strongest-vs-second-strongest separation stays small.
            ((sorted[0] - sorted[1]) / overall).coerceIn(0f, 1f)
        }
    }

    private data class TempoCandidateStats(
        val bpm: Float,
        val stability: Float,
        val evidence: Float,
        val count: Int,
    )

    private fun appendTempoCandidates(
        autocorrBpm: Float,
        autocorrConfidence: Float,
        onsetBpm: Float,
        onsetConfidence: Float,
    ) {
        tempoAutocorrHistory[tempoHistoryIndex] = autocorrBpm
        tempoAutocorrConfidenceHistory[tempoHistoryIndex] = autocorrConfidence
        tempoOnsetHistory[tempoHistoryIndex] = onsetBpm
        tempoOnsetConfidenceHistory[tempoHistoryIndex] = onsetConfidence
        tempoHistoryIndex = (tempoHistoryIndex + 1) % tempoAutocorrHistory.size
        tempoHistoryCount = minOf(tempoHistoryCount + 1, tempoAutocorrHistory.size)
    }

    private fun tempoCandidateStats(
        values: FloatArray,
        confidences: FloatArray,
    ): TempoCandidateStats {
        if (tempoHistoryCount <= 0) return TempoCandidateStats(0f, 0f, 0f, 0)
        val bpms = mutableListOf<Float>()
        val quality = mutableListOf<Float>()
        val start = if (tempoHistoryCount < values.size) 0 else tempoHistoryIndex
        for (i in 0 until tempoHistoryCount) {
            val index = (start + i) % values.size
            val bpm = values[index]
            if (bpm <= 0f) continue
            bpms += bpm
            quality += confidences[index].coerceIn(0f, 1f)
        }
        if (bpms.isEmpty()) return TempoCandidateStats(0f, 0f, 0f, 0)

        val center = median(bpms)
        val mad = median(bpms.map { kotlin.math.abs(it - center) })
        val stability = (1f - mad / 12f).coerceIn(0f, 1f)
        val coverage = (bpms.size.toFloat() / tempoHistoryCount.coerceAtLeast(1).toFloat())
            .coerceIn(0f, 1f)
        val evidence = (
            median(quality) * 0.62f +
                stability * 0.28f +
                coverage * 0.10f
            ).coerceIn(0f, 1f)
        return TempoCandidateStats(center, stability, evidence, bpms.size)
    }

    private fun relationRatio(a: Float, b: Float): Float {
        if (a <= 0f || b <= 0f) return 1f
        return maxOf(a, b) / minOf(a, b)
    }

    private fun updateRhythm() {
        val onset = chronologicalRhythm(rhythmOnsetHistory)
        if (onset.size < 96) return

        val secondsPerWindow = measuredProcessIntervalSeconds() / 4.0
        val minLag = maxOf(3, (60.0 / (190.0 * secondsPerWindow)).roundToInt())
        val maxLag = minOf(
            onset.size / 3,
            (60.0 / (55.0 * secondsPerWindow)).roundToInt(),
        )
        if (maxLag <= minLag) return

        var bestLag = 0
        var bestCorrelation = -1f
        for (lag in minLag..maxLag) {
            val value = correlation(onset, lag)
            if (value > bestCorrelation) {
                bestCorrelation = value
                bestLag = lag
            }
        }
        if (bestLag <= 0) return

        // Autocorrelation is one candidate, not the authority. Keep the
        // high-tempo harmonic guard, but never auto-promote a stable low pulse
        // to double-time: the 60 BPM reference proved that rule was unsafe.
        var autoLag = bestLag
        var autoCorrelation = bestCorrelation
        val rawAutoBpm = (60.0 / (bestLag * secondsPerWindow)).toFloat()
        val slowerLag = bestLag * 2
        if (rawAutoBpm > 145f && slowerLag <= maxLag) {
            val slowerCorrelation = correlation(onset, slowerLag)
            if (slowerCorrelation >= bestCorrelation * 0.72f) {
                autoLag = slowerLag
                autoCorrelation = slowerCorrelation
            }
        }

        val autoBpm = (60.0 / (autoLag * secondsPerWindow)).toFloat()
            .coerceIn(55f, 190f)
        val autoHarmonicPenalty = (autoCorrelation / bestCorrelation.coerceAtLeast(1e-4f))
            .coerceIn(0.65f, 1f)
        val autoConfidence = (
            ((bestCorrelation - 0.08f) / 0.52f).coerceIn(0f, 1f) * autoHarmonicPenalty
            ).coerceIn(0f, 1f)

        val (onsetBpm, onsetConfidence) = peakIntervalTempo(onset, secondsPerWindow)
        tempoAutocorrBpm = autoBpm
        tempoOnsetBpm = onsetBpm
        tempoAutocorrConfidence = autoConfidence
        tempoOnsetConfidence = onsetConfidence
        appendTempoCandidates(autoBpm, autoConfidence, onsetBpm, onsetConfidence)

        val autoStats = tempoCandidateStats(
            tempoAutocorrHistory,
            tempoAutocorrConfidenceHistory,
        )
        val onsetStats = tempoCandidateStats(
            tempoOnsetHistory,
            tempoOnsetConfidenceHistory,
        )
        val autoStable = autoStats.count >= 4 && autoStats.stability >= 0.55f
        val onsetStable = onsetStats.count >= 4 && onsetStats.stability >= 0.62f

        var selectedBpm = if (autoStable) autoStats.bpm else autoBpm
        var selectedEvidence = if (autoStable) autoStats.evidence else autoConfidence
        var selectedStability = if (autoStable) autoStats.stability else 0.35f
        tempoSource = "autocorr"

        if (!autoStable && onsetStable) {
            selectedBpm = onsetStats.bpm
            selectedEvidence = onsetStats.evidence
            selectedStability = onsetStats.stability
            tempoSource = "onset"
        } else if (autoStable && onsetStable) {
            val disagreement = kotlin.math.abs(autoStats.bpm - onsetStats.bpm)
            val ratio = relationRatio(autoStats.bpm, onsetStats.bpm)
            when {
                disagreement <= 6f -> {
                    val autoWeight = autoStats.evidence.coerceAtLeast(0.05f)
                    val onsetWeight = onsetStats.evidence.coerceAtLeast(0.05f)
                    selectedBpm = (
                        autoStats.bpm * autoWeight + onsetStats.bpm * onsetWeight
                        ) / (autoWeight + onsetWeight)
                    selectedEvidence = maxOf(autoStats.evidence, onsetStats.evidence)
                    selectedStability = minOf(autoStats.stability, onsetStats.stability)
                    tempoSource = "blend"
                }
                // The 120 BPM references repeatedly exposed a stable 3:2-ish
                // ambiguity (autocorr near 72/80, onset near 117). In that case
                // a stable onset candidate describes the musical pulse better.
                ratio in 1.34f..1.72f &&
                    onsetStats.stability >= 0.72f &&
                    onsetStats.evidence >= 0.58f -> {
                    selectedBpm = onsetStats.bpm
                    selectedEvidence = onsetStats.evidence
                    selectedStability = onsetStats.stability
                    tempoSource = "onset"
                }
                // Near-octave disagreement needs macro-pulse evidence. A true
                // 60 BPM 2/4 reference has a strong two-beat accent at the slower
                // pulse, while 120 BPM 4/4 falsely folded to half-time does not.
                ratio in 1.84f..2.16f && autoStats.bpm < onsetStats.bpm -> {
                    val energyForOctave = chronologicalRhythm(rhythmEnergyHistory)
                    val slowAccent2 = accentPeriodicity(energyForOctave, autoLag, 2)
                    val onsetCanOwnPulse =
                        onsetStats.stability >= 0.72f &&
                            onsetStats.evidence >= 0.58f &&
                            slowAccent2 < 0.20f
                    if (onsetCanOwnPulse) {
                        selectedBpm = onsetStats.bpm
                        selectedEvidence = onsetStats.evidence
                        selectedStability = onsetStats.stability
                        tempoSource = "onset"
                    } else {
                        selectedBpm = autoStats.bpm
                        selectedEvidence = autoStats.evidence
                        selectedStability = autoStats.stability
                        tempoSource = "autocorr"
                    }
                }
                onsetStats.evidence >= autoStats.evidence + 0.18f &&
                    onsetStats.stability >= autoStats.stability + 0.08f -> {
                    selectedBpm = onsetStats.bpm
                    selectedEvidence = onsetStats.evidence
                    selectedStability = onsetStats.stability
                    tempoSource = "onset"
                }
            }
        }

        val candidateRatio = if (autoStats.bpm > 0f && onsetStats.bpm > 0f) {
            relationRatio(autoStats.bpm, onsetStats.bpm)
        } else 1f
        val relationshipConfidence = when {
            autoStats.bpm <= 0f || onsetStats.bpm <= 0f -> 0.72f
            kotlin.math.abs(autoStats.bpm - onsetStats.bpm) <= 12f -> 1f
            candidateRatio in 1.34f..1.72f -> 0.86f
            candidateRatio in 1.84f..2.16f -> 0.78f
            else -> 0.58f
        }

        // Harmonic-only sources can contain periodic note attacks without a
        // trustworthy musical pulse. Use timbre only as a confidence brake,
        // never as a BPM correction.
        val transientRatio = latestPercussive /
            (latestHarmonic + 0.12f).coerceAtLeast(0.12f)
        val transientSupport = ((transientRatio - 0.20f) / 0.65f).coerceIn(0f, 1f)
        val timbreGate = 0.38f + transientSupport * 0.62f
        val instantConfidence = (
            selectedEvidence * selectedStability * relationshipConfidence * timbreGate
            ).coerceIn(0f, 1f)
        beatConfidence = beatConfidence * 0.72f + instantConfidence * 0.28f

        val reliableEvidence =
            selectedBpm in 55f..190f &&
                selectedEvidence >= 0.45f &&
                selectedStability >= 0.58f
        val reliableCandidate = reliableEvidence && beatConfidence >= 0.46f

        if (tempoBpm <= 0f && reliableCandidate) {
            tempoBpm = selectedBpm
            pendingTempoBpm = 0f
            pendingTempoCount = 0
        } else if (tempoBpm > 0f) {
            val distance = kotlin.math.abs(selectedBpm - tempoBpm)
            if (distance <= 16f) {
                pendingTempoBpm = 0f
                pendingTempoCount = 0
                if (reliableCandidate) {
                    tempoBpm += (selectedBpm - tempoBpm) * 0.28f
                }
            } else if (reliableCandidate) {
                if (
                    pendingTempoBpm > 0f &&
                    kotlin.math.abs(selectedBpm - pendingTempoBpm) <= 8f
                ) {
                    pendingTempoCount += 1
                    pendingTempoBpm = pendingTempoBpm * 0.65f + selectedBpm * 0.35f
                } else {
                    pendingTempoBpm = selectedBpm
                    pendingTempoCount = 1
                }

                // A real source/tempo transition must persist for multiple
                // rhythm updates before it can pull the public tempo.
                if (pendingTempoCount >= 4) {
                    val delta = (pendingTempoBpm - tempoBpm).coerceIn(-24f, 24f)
                    tempoBpm += delta * 0.32f
                    if (kotlin.math.abs(pendingTempoBpm - tempoBpm) <= 12f) {
                        pendingTempoBpm = 0f
                        pendingTempoCount = 0
                    }
                }
            }
        }

        val inPendingTransition =
            pendingTempoCount in 1..3 &&
                pendingTempoBpm > 0f &&
                kotlin.math.abs(pendingTempoBpm - tempoBpm) > 16f

        // Reliability is a state, not a per-frame threshold. Enter only with
        // strong evidence; once locked, tolerate short confidence dips so a
        // steady drum pulse does not flicker between a meter and unknown.
        if (reliableCandidate && !inPendingTransition) {
            tempoReliabilityHold = 6
        } else if (
            tempoReliabilityHold > 0 &&
            reliableEvidence &&
            beatConfidence >= 0.32f &&
            !inPendingTransition
        ) {
            tempoReliabilityHold = 6
        } else if (tempoReliabilityHold > 0) {
            tempoReliabilityHold -= 1
        }
        tempoReliable =
            !inPendingTransition &&
                reliableEvidence &&
                (reliableCandidate || tempoReliabilityHold > 0)

        if (!tempoReliable) {
            meter = "unknown"
            meterConfidence = 0f
            subdivisionSimple *= 0.82f
            subdivisionTriplet *= 0.82f
            swingness *= 0.82f
            return
        }

        val energy = chronologicalRhythm(rhythmEnergyHistory)
        val tempoBeatLag = (
            60.0 / (tempoBpm.coerceIn(55f, 190f) * secondsPerWindow)
            ).roundToInt().coerceIn(minLag, maxLag)

        // BPM estimation can be a few percent biased while still musically
        // correct (the 120 BPM onset estimator sits near 117). Meter phase is
        // much more sensitive: one subwindow of lag error can erase a 4-beat
        // downbeat pattern. Refine only the meter lag locally; never rewrite
        // the public tempo from this search.
        var beatLag = tempoBeatLag
        var bestMeterLagScore = -1f
        for (candidateLag in maxOf(minLag, tempoBeatLag - 1)..minOf(maxLag, tempoBeatLag + 1)) {
            val c2 = maxOf(0f, correlation(energy, candidateLag * 2))
            val c3 = maxOf(0f, correlation(energy, candidateLag * 3))
            val c4 = maxOf(0f, correlation(energy, candidateLag * 4))
            val a2 = accentPeriodicity(energy, candidateLag, 2)
            val a3 = accentPeriodicity(energy, candidateLag, 3)
            val a4 = accentPeriodicity(energy, candidateLag, 4)
            val periodic = maxOf(c2, c3, c4)
            val accent = maxOf(a2, a3, a4)
            val score = periodic * 0.62f + accent * 0.38f
            if (score > bestMeterLagScore) {
                bestMeterLagScore = score
                beatLag = candidateLag
            }
        }
        meterBeatLag = beatLag

        val corr2 = correlation(energy, beatLag * 2)
        val corr3 = correlation(energy, beatLag * 3)
        val corr4 = correlation(energy, beatLag * 4)
        meterCorr2 = corr2
        meterCorr3 = corr3
        meterCorr4 = corr4
        meterAccent2 = accentPeriodicity(energy, beatLag, 2)
        meterAccent3 = accentPeriodicity(energy, beatLag, 3)
        meterAccent4 = accentPeriodicity(energy, beatLag, 4)

        // Simple meter divides a beat in two; compound meter divides it in
        // three. The previous implementation compared /2 with 2/3 of a beat,
        // which cannot represent a triplet subdivision.
        val simpleLag = maxOf(1, (beatLag / 2f).roundToInt())
        val tripletLag = maxOf(1, (beatLag / 3f).roundToInt())
        val simpleOnset = maxOf(0f, correlation(onset, simpleLag))
        val simpleEnergy = maxOf(0f, correlation(energy, simpleLag))
        val tripletOnset = maxOf(0f, correlation(onset, tripletLag))
        val tripletEnergy = maxOf(0f, correlation(energy, tripletLag))
        val simpleScore = (simpleOnset * 0.72f + simpleEnergy * 0.28f).coerceIn(0f, 1f)
        val tripletScore = (tripletOnset * 0.72f + tripletEnergy * 0.28f).coerceIn(0f, 1f)
        subdivisionSimple = subdivisionSimple * 0.70f + simpleScore * 0.30f
        subdivisionTriplet = subdivisionTriplet * 0.70f + tripletScore * 0.30f

        val positive2 = maxOf(0f, corr2)
        val positive3 = maxOf(0f, corr3)
        val positive4 = maxOf(0f, corr4)
        val macro2 = (positive2 * 0.55f + meterAccent2 * 0.45f).coerceIn(0f, 1f)
        val macro3 = (positive3 * 0.55f + meterAccent3 * 0.45f).coerceIn(0f, 1f)
        val macro4 = (positive4 * 0.55f + meterAccent4 * 0.45f).coerceIn(0f, 1f)

        val clearTwoBeatAccent =
            corr2 >= 0.36f &&
                meterAccent2 >= 0.22f &&
                meterAccent2 >= meterAccent3 + 0.10f &&
                meterAccent2 >= meterAccent4 + 0.12f

        val rankedMacro = listOf(
            2 to macro2,
            3 to macro3,
            4 to macro4,
        ).sortedByDescending { it.second }
        val bestMacro = rankedMacro[0]
        val secondMacro = rankedMacro[1]
        val macroGap = bestMacro.second - secondMacro.second
        val macroMeter = when {
            clearTwoBeatAccent -> 2
            bestMacro.second >= 0.24f && macroGap >= 0.04f -> bestMacro.first
            meterAccent4 >= 0.46f && macro4 >= 0.24f -> 4
            meterAccent3 >= 0.34f && macro3 >= 0.24f -> 3
            else -> 0
        }

        val tripletDominance = subdivisionTriplet - subdivisionSimple
        val compound =
            subdivisionTriplet >= 0.18f &&
                tripletDominance >= 0.06f

        meter = when (macroMeter) {
            2 -> if (compound) "6/8" else "2/4"
            3 -> "3/4"
            4 -> if (compound) "12/8" else "4/4"
            else -> "unknown"
        }
        meterConfidence = if (macroMeter == 0) {
            0f
        } else {
            (
                bestMacro.second * 0.72f +
                    macroGap.coerceIn(0f, 0.35f) * 0.80f
                ).coerceIn(0f, 1f) * beatConfidence
        }

        val swingCandidate = (
            (subdivisionTriplet - subdivisionSimple - 0.02f) * 2.4f
            ).coerceIn(0f, 1f)
        swingness = swingness * 0.76f + swingCandidate * 0.24f
    }

    private fun dynamicRange(): Float {
        if (historyCount < 12) return 0f
        val values = chronological(energyHistory)
        var min = 1f
        var max = 0f
        for (value in values) {
            if (value <= 0.01f) continue
            min = kotlin.math.min(min, value)
            max = kotlin.math.max(max, value)
        }
        if (max <= min || min >= 1f) return 0f
        return (max - min).coerceIn(0f, 1f)
    }

    private fun bandLevel(magnitudes: FloatArray, lowHz: Double, highHz: Double): Float {
        var power = 0.0
        var count = 0
        for (bin in magnitudes.indices) {
            val frequency = bin * sampleRate.toDouble() / fftSize
            if (frequency < lowHz || frequency >= highHz) continue
            power += magnitudes[bin] * magnitudes[bin]
            count += 1
        }

        if (count == 0) return 0f
        val db = 10.0 * log10(power / count + 1e-12)
        return ((db + 100.0) / 75.0).toFloat().coerceIn(0f, 1f)
    }

    private fun amplitudeLevel(value: Double): Float {
        val db = 20.0 * log10(value + 1e-9)
        return ((db + 60.0) / 54.0).toFloat().coerceIn(0f, 1f)
    }

    private fun peakAmplitudeLevel(value: Double): Float {
        val db = 20.0 * log10(value + 1e-9)
        return ((db + 30.0) / 30.0).toFloat().coerceIn(0f, 1f)
    }

    private fun fft(re: FloatArray, im: FloatArray) {
        var j = 0
        for (i in 1 until fftSize) {
            var bit = fftSize shr 1
            while (j and bit != 0) {
                j = j xor bit
                bit = bit shr 1
            }
            j = j xor bit
            if (i < j) {
                val tr = re[i]; re[i] = re[j]; re[j] = tr
                val ti = im[i]; im[i] = im[j]; im[j] = ti
            }
        }

        var length = 2
        while (length <= fftSize) {
            val angle = -2.0 * PI / length
            val wLenRe = cos(angle).toFloat()
            val wLenIm = sin(angle).toFloat()
            var start = 0
            while (start < fftSize) {
                var wRe = 1f
                var wIm = 0f
                for (offset in 0 until length / 2) {
                    val even = start + offset
                    val odd = even + length / 2
                    val oddRe = re[odd] * wRe - im[odd] * wIm
                    val oddIm = re[odd] * wIm + im[odd] * wRe
                    val evenRe = re[even]
                    val evenIm = im[even]
                    re[even] = evenRe + oddRe
                    im[even] = evenIm + oddIm
                    re[odd] = evenRe - oddRe
                    im[odd] = evenIm - oddIm

                    val nextRe = wRe * wLenRe - wIm * wLenIm
                    wIm = wRe * wLenIm + wIm * wLenRe
                    wRe = nextRe
                }
                start += length
            }
            length = length shl 1
        }
    }
}
