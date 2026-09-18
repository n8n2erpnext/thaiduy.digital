package digital.thaiduy.sentinelmusic

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

class CaptureService : Service() {
    companion object {
        const val ACTION_START = "digital.thaiduy.sentinelmusic.START"
        const val ACTION_STOP = "digital.thaiduy.sentinelmusic.STOP"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_PROJECTION_DATA = "projection_data"
        private const val CHANNEL_ID = "sentinel_music_sensor"
        private const val NOTIFICATION_ID = 4107
    }

    private var projection: MediaProjection? = null
    private var recorder: AudioRecord? = null

    private val captureExecutor = Executors.newSingleThreadExecutor()
    private val sendExecutor = Executors.newSingleThreadScheduledExecutor()
    private val latest = AtomicReference<DspFeatures?>(null)
    private val sequence = AtomicLong(0)
    @Volatile private var running = false

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Sentinel Music Sensor",
            NotificationManager.IMPORTANCE_LOW,
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> stopCapture()
            ACTION_START -> startCapture(intent)
        }
        return START_NOT_STICKY
    }

    private fun notification(): Notification =
        Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Sentinel Music Sensor")
            .setContentText("Analyzing playback locally · no raw audio uploaded")
            .setOngoing(true)
            .build()

    private fun startCapture(intent: Intent) {
        if (running) return
        startForeground(
            NOTIFICATION_ID,
            notification(),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
        )

        val token = SecureStore.token(this)
        val deviceId = SecureStore.deviceId(this)
        if (token == null || deviceId == null) {
            stopCapture()
            return
        }

        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        @Suppress("DEPRECATION")
        val data = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(EXTRA_PROJECTION_DATA, Intent::class.java)
        } else {
            intent.getParcelableExtra(EXTRA_PROJECTION_DATA)
        } ?: run {
            stopCapture()
            return
        }

        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val mediaProjection = manager.getMediaProjection(resultCode, data)
        projection = mediaProjection

        mediaProjection.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                stopCapture()
            }
        }, Handler(Looper.getMainLooper()))

        val sampleRate = 48_000
        val channelMask = AudioFormat.CHANNEL_IN_STEREO
        val format = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(sampleRate)
            .setChannelMask(channelMask)
            .build()

        val playbackConfig = android.media.AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_GAME)
            .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
            .build()

        val minBuffer = AudioRecord.getMinBufferSize(
            sampleRate,
            channelMask,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        val bufferBytes = maxOf(minBuffer, 32_768)

        val audioRecord = AudioRecord.Builder()
            .setAudioFormat(format)
            .setBufferSizeInBytes(bufferBytes)
            .setAudioPlaybackCaptureConfig(playbackConfig)
            .build()
        if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
            audioRecord.release()
            stopCapture()
            return
        }

        recorder = audioRecord
        running = true
        audioRecord.startRecording()

        captureExecutor.execute {
            val engine = DspEngine(sampleRate)
            val buffer = ShortArray(8_192)
            while (running) {
                val read = audioRecord.read(
                    buffer,
                    0,
                    buffer.size,
                    AudioRecord.READ_BLOCKING,
                )
                if (read > 0) latest.set(engine.process(buffer, read, 2))
            }
        }

        val windowMs = (4_096 * 1_000 / sampleRate)
        sendExecutor.scheduleWithFixedDelay({
            if (!running) return@scheduleWithFixedDelay
            val features = latest.getAndSet(null) ?: return@scheduleWithFixedDelay
            ApiClient.sendFrame(
                token = token,
                deviceId = deviceId,
                seq = sequence.incrementAndGet(),
                sampleRate = sampleRate,
                windowMs = windowMs,
                features = features,
            )
        }, 0, 125, TimeUnit.MILLISECONDS)
    }

    private fun stopCapture() {
        if (!running && recorder == null && projection == null) {
            stopSelf()
            return
        }
        running = false
        runCatching { recorder?.stop() }
        runCatching { recorder?.release() }
        recorder = null
        val currentProjection = projection
        projection = null
        runCatching { currentProjection?.stop() }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        running = false
        runCatching { recorder?.stop() }
        runCatching { recorder?.release() }
        recorder = null
        captureExecutor.shutdownNow()
        sendExecutor.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
