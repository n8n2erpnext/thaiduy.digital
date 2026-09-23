package digital.thaiduy.hub

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import java.io.ByteArrayOutputStream
import kotlin.math.min

class AacTransportEncoder(
    private val sampleRate: Int = 48_000,
    private val channels: Int = 2,
    private val bitrate: Int = 128_000,
    private val onChunk: (ByteArray) -> Unit,
) {
    private val codec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_AUDIO_AAC)
    private val info = MediaCodec.BufferInfo()
    private val batch = ByteArrayOutputStream(8_192)
    private var submittedFrames = 0L
    private var lastFlushMs = System.currentTimeMillis()
    private var closed = false

    init {
        val format = MediaFormat.createAudioFormat(
            MediaFormat.MIMETYPE_AUDIO_AAC,
            sampleRate,
            channels,
        ).apply {
            setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
            setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
            setInteger(MediaFormat.KEY_MAX_INPUT_SIZE, 32_768)
        }
        codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        codec.start()
    }

    fun offer(samples: ShortArray, count: Int) {
        if (closed || count <= 0) return
        val usable = count - (count % channels)
        var offset = 0
        while (offset < usable) {
            drain()
            val inputIndex = codec.dequeueInputBuffer(10_000)
            if (inputIndex < 0) continue
            val input = codec.getInputBuffer(inputIndex) ?: continue
            input.clear()
            val shorts = min(usable - offset, input.remaining() / 2)
            if (shorts <= 0) continue
            for (i in 0 until shorts) {
                val value = samples[offset + i].toInt()
                input.put((value and 0xff).toByte())
                input.put(((value ushr 8) and 0xff).toByte())
            }
            val frameCount = shorts / channels
            val ptsUs = submittedFrames * 1_000_000L / sampleRate
            codec.queueInputBuffer(inputIndex, 0, shorts * 2, ptsUs, 0)
            submittedFrames += frameCount
            offset += shorts
            drain()
        }
    }

    private fun drain() {
        while (true) {
            val outputIndex = codec.dequeueOutputBuffer(info, 0)
            if (outputIndex == MediaCodec.INFO_TRY_AGAIN_LATER) break
            if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) continue
            if (outputIndex < 0) continue

            val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
            if (!isConfig && info.size > 0) {
                val output = codec.getOutputBuffer(outputIndex)
                if (output != null) {
                    output.position(info.offset)
                    output.limit(info.offset + info.size)
                    val payload = ByteArray(info.size)
                    output.get(payload)
                    batch.write(adtsHeader(payload.size))
                    batch.write(payload)
                }
            }
            codec.releaseOutputBuffer(outputIndex, false)

            val now = System.currentTimeMillis()
            if (batch.size() >= 4_096 || now - lastFlushMs >= 180) {
                flushBatch(now)
            }
        }
    }

    private fun flushBatch(now: Long = System.currentTimeMillis()) {
        if (batch.size() <= 0) return
        onChunk(batch.toByteArray())
        batch.reset()
        lastFlushMs = now
    }

    private fun adtsHeader(payloadSize: Int): ByteArray {
        val profile = 2 // AAC LC object type
        val frequencyIndex = when (sampleRate) {
            96_000 -> 0
            88_200 -> 1
            64_000 -> 2
            48_000 -> 3
            44_100 -> 4
            32_000 -> 5
            24_000 -> 6
            22_050 -> 7
            16_000 -> 8
            12_000 -> 9
            11_025 -> 10
            8_000 -> 11
            else -> error("Unsupported AAC sample rate: $sampleRate")
        }
        val packetLength = payloadSize + 7
        val channelConfig = channels.coerceIn(1, 7)
        return byteArrayOf(
            0xff.toByte(),
            0xf1.toByte(),
            (((profile - 1) shl 6) or (frequencyIndex shl 2) or (channelConfig shr 2)).toByte(),
            (((channelConfig and 3) shl 6) or (packetLength shr 11)).toByte(),
            ((packetLength shr 3) and 0xff).toByte(),
            (((packetLength and 7) shl 5) or 0x1f).toByte(),
            0xfc.toByte(),
        )
    }

    fun close() {
        if (closed) return
        closed = true
        runCatching {
            val inputIndex = codec.dequeueInputBuffer(10_000)
            if (inputIndex >= 0) {
                val ptsUs = submittedFrames * 1_000_000L / sampleRate
                codec.queueInputBuffer(
                    inputIndex,
                    0,
                    0,
                    ptsUs,
                    MediaCodec.BUFFER_FLAG_END_OF_STREAM,
                )
            }
            repeat(8) { drain() }
        }
        flushBatch()
        runCatching { codec.stop() }
        runCatching { codec.release() }
    }
}
