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
    val beatConfidence: Float,
    val meter: String,
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
    private var historyCount = 0
    private var historyIndex = 0
    private var fluxBaseline = 0f
    private var processCount = 0L

    private var tempoBpm = 0f
    private var beatConfidence = 0f
    private var meter = "unknown"
    private var swingness = 0f

    fun process(interleaved: ShortArray, count: Int, channels: Int = 2): DspFeatures {
        val re = FloatArray(fftSize)
        val im = FloatArray(fftSize)
        val frames = minOf(count / channels, fftSize)
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
        val peakLevel = amplitudeLevel(peak.toDouble())
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

        appendHistory(spectralFlux, rms)
        processCount += 1
        if (processCount % 6L == 0L && historyCount >= 40) {
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
            beatConfidence = beatConfidence,
            meter = meter,
            swingness = swingness,
            percussiveProbability = percussive,
            harmonicProbability = harmonic,
            dynamicRange = dynamicRange,
        )
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

    private fun updateRhythm() {
        val onset = chronological(onsetHistory)
        if (onset.size < 40) return

        val secondsPerWindow = fftSize.toDouble() / sampleRate.toDouble()
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

        val candidateBpm = (60.0 / (bestLag * secondsPerWindow)).toFloat()
        val confidence = ((bestCorrelation - 0.08f) / 0.52f).coerceIn(0f, 1f)

        beatConfidence = beatConfidence * 0.72f + confidence * 0.28f
        if (confidence >= 0.18f) {
            tempoBpm = if (tempoBpm <= 0f) {
                candidateBpm
            } else {
                tempoBpm * 0.82f + candidateBpm * 0.18f
            }
        }

        if (beatConfidence < 0.48f) {
            meter = "unknown"
            swingness *= 0.82f
            return
        }

        val energy = chronological(energyHistory)
        val corr3 = correlation(energy, bestLag * 3)
        val corr4 = correlation(energy, bestLag * 4)
        val meterMargin = kotlin.math.abs(corr3 - corr4)
        meter = if (meterMargin >= 0.12f) {
            if (corr3 > corr4) "3/4" else "4/4"
        } else {
            "unknown"
        }

        val straightSubdivision = correlation(onset, maxOf(1, bestLag / 2))
        val tripletSubdivision = correlation(onset, maxOf(1, (bestLag * 2f / 3f).roundToInt()))
        val swingCandidate = if (tripletSubdivision > straightSubdivision + 0.08f) {
            ((tripletSubdivision - straightSubdivision) * 2.2f).coerceIn(0f, 1f)
        } else 0f
        swingness = swingness * 0.78f + swingCandidate * 0.22f

        if (meter == "3/4" && swingness >= 0.62f && beatConfidence >= 0.62f) {
            meter = "6/8"
        }
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
