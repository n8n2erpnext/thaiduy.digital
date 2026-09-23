package digital.thaiduy.hub

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
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
        const val ACTION_START = "digital.thaiduy.hub.START_DSP"
        const val ACTION_STOP = "digital.thaiduy.hub.STOP_DSP"
        const val EXTRA_RESULT_CODE = "result_code"
        const val EXTRA_PROJECTION_DATA = "projection_data"
        const val ACTION_STATE = "digital.thaiduy.hub.DSP_STATE"
        private const val CHANNEL_ID = "thaiduy_hub_live_dsp"
        private const val NOTIFICATION_ID = 4107
        private const val SAMPLE_RATE = 48_000
        private const val FFT_SIZE = 4_096
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
            "Thái Duy Hub · Live DSP",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Live local playback analysis for thaiduy.digital"
            setShowBadge(false)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> stopCapture()
            ACTION_START -> startCapture(intent)
        }
        return START_NOT_STICKY
    }

    private fun notification(sourceCount: Int): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
            .putExtra(MainActivity.EXTRA_OPEN_TAB, "sensor")
        val pending = PendingIntent.getActivity(
            this,
            4107,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        return Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Thái Duy Hub · Live DSP")
            .setContentText("$sourceCount selected source app(s) · raw audio stays on device")
            .setContentIntent(pending)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
    }

    private fun startCapture(intent: Intent) {
        if (running) return

        val token = SecureStore.token(this)
        val deviceId = SecureStore.deviceId(this)
        val sourceUids = TrackedApps.uids(this)
        if (token == null || deviceId == null) {
            SensorState.error(this, "Pair Hub before starting Live DSP.")
            stopSelf()
            return
        }
        if (sourceUids.isEmpty()) {
            SensorState.error(this, "Select at least one music source app.")
            stopSelf()
            return
        }

        startForeground(
            NOTIFICATION_ID,
            notification(sourceUids.size),
            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION,
        )

        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        @Suppress("DEPRECATION")
        val data = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(EXTRA_PROJECTION_DATA, Intent::class.java)
        } else {
            intent.getParcelableExtra(EXTRA_PROJECTION_DATA)
        } ?: run {
            SensorState.error(this, "Playback capture consent is missing.")
            stopCapture()
            return
        }

        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val mediaProjection = runCatching { manager.getMediaProjection(resultCode, data) }
            .getOrElse {
                SensorState.error(this, "Android rejected the playback capture session.")
                stopCapture()
                return
            }
        projection = mediaProjection

        mediaProjection.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                stopCapture()
            }
        }, Handler(Looper.getMainLooper()))

        val channelMask = AudioFormat.CHANNEL_IN_STEREO
        val format = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(SAMPLE_RATE)
            .setChannelMask(channelMask)
            .build()

        val captureBuilder =
            android.media.AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
                .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
                .addMatchingUsage(AudioAttributes.USAGE_GAME)
                .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN)
        sourceUids.forEach(captureBuilder::addMatchingUid)

        val minBuffer = AudioRecord.getMinBufferSize(
            SAMPLE_RATE,
            channelMask,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        val bufferBytes = maxOf(minBuffer, 32_768)

        val audioRecord = runCatching {
            AudioRecord.Builder()
                .setAudioFormat(format)
                .setBufferSizeInBytes(bufferBytes)
                .setAudioPlaybackCaptureConfig(captureBuilder.build())
                .build()
        }.getOrElse {
            SensorState.error(this, "Selected source cannot be captured on this device.")
            stopCapture()
            return
        }

        if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
            audioRecord.release()
            SensorState.error(this, "Audio playback capture failed to initialize.")
            stopCapture()
            return
        }

        recorder = audioRecord
        running = true
        SensorState.setRunning(this, true)
        sendBroadcast(Intent(ACTION_STATE).setPackage(packageName))
        audioRecord.startRecording()

        captureExecutor.execute {
            val engine = DspEngine(SAMPLE_RATE, FFT_SIZE)
            val buffer = ShortArray(8_192)
            var silentWindows = 0
            while (running) {
                val read = audioRecord.read(
                    buffer,
                    0,
                    buffer.size,
                    AudioRecord.READ_BLOCKING,
                )
                if (read <= 0) continue
                val features = engine.process(buffer, read, 2)
                latest.set(features)
                SensorState.frame(this, features)
                silentWindows = if (features.peak < 0.01f) silentWindows + 1 else 0
                if (silentWindows == 30) {
                    SensorState.error(
                        this,
                        "No capturable audio yet. The source may be paused, protected, or blocking playback capture.",
                    )
                }
            }
        }

        val windowMs = FFT_SIZE * 1_000 / SAMPLE_RATE
        sendExecutor.scheduleWithFixedDelay({
            if (!running) return@scheduleWithFixedDelay
            val features = latest.getAndSet(null) ?: return@scheduleWithFixedDelay
            ApiClient.sendFrame(
                token = token,
                deviceId = deviceId,
                seq = sequence.incrementAndGet(),
                sampleRate = SAMPLE_RATE,
                windowMs = windowMs,
                features = features,
            )
        }, 0, 100, TimeUnit.MILLISECONDS)
    }

    private fun stopCapture() {
        running = false
        SensorState.setRunning(this, false)
        runCatching { recorder?.stop() }
        runCatching { recorder?.release() }
        recorder = null

        val activeProjection = projection
        projection = null
        runCatching { activeProjection?.stop() }

        sendBroadcast(Intent(ACTION_STATE).setPackage(packageName))
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        running = false
        SensorState.setRunning(this, false)
        runCatching { recorder?.stop() }
        runCatching { recorder?.release() }
        recorder = null
        captureExecutor.shutdownNow()
        sendExecutor.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
