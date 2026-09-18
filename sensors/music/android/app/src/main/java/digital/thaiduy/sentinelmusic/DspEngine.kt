package digital.thaiduy.sentinelmusic

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.log10
import kotlin.math.max
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
)

class DspEngine(
    private val sampleRate: Int = 48_000,
    private val fftSize: Int = 4_096,
) {
    private val previous = FloatArray(fftSize / 2 + 1)

    fun process(interleaved: ShortArray, count: Int, channels: Int = 2): DspFeatures {
        val re = FloatArray(fftSize)
        val im = FloatArray(fftSize)
        val frames = minOf(count / channels, fftSize)
        var rmsSum = 0.0
        var peak = 0f

        for (i in 0 until frames) {
            var mixed = 0f
            for (channel in 0 until channels) {
                mixed += interleaved[i * channels + channel] / 32768f
            }
            mixed /= channels.toFloat()
            rmsSum += mixed * mixed
            peak = max(peak, kotlin.math.abs(mixed))
            val window = (0.5 - 0.5 * cos(2.0 * PI * i / (fftSize - 1))).toFloat()
            re[i] = mixed * window
        }

        fft(re, im)
        val magnitudes = FloatArray(fftSize / 2 + 1)

        var magnitudeSum = 0.0
        var weightedFrequency = 0.0
        for (bin in magnitudes.indices) {
            val magnitude = sqrt(re[bin] * re[bin] + im[bin] * im[bin]) / (fftSize / 2f)
            magnitudes[bin] = magnitude
            val frequency = bin * sampleRate.toDouble() / fftSize
            magnitudeSum += magnitude
            weightedFrequency += frequency * magnitude
        }

        var flux = 0.0
        val normDenom = magnitudeSum.coerceAtLeast(1e-12)
        for (bin in magnitudes.indices) {
            val normalized = (magnitudes[bin] / normDenom).toFloat()
            flux += max(0f, normalized - previous[bin])
            previous[bin] = normalized
        }

        val rawRms = sqrt(rmsSum / frames.coerceAtLeast(1))
        return DspFeatures(
            rms = amplitudeLevel(rawRms),
            peak = amplitudeLevel(peak.toDouble()),

            bass = bandLevel(magnitudes, 20.0, 180.0),
            lowMid = bandLevel(magnitudes, 180.0, 800.0),
            mid = bandLevel(magnitudes, 800.0, 2_000.0),
            presence = bandLevel(magnitudes, 2_000.0, 6_000.0),
            air = bandLevel(magnitudes, 6_000.0, 16_000.0),
            spectralFlux = (flux * 12.0).toFloat().coerceIn(0f, 1f),
            spectralCentroid = if (magnitudeSum > 1e-12) {
                (weightedFrequency / magnitudeSum).toFloat()
            } else 0f,
        )
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
