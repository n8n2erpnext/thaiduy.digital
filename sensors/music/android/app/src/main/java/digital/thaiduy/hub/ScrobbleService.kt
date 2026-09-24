package digital.thaiduy.hub

import android.app.Notification
import android.content.ComponentName
import android.content.Intent
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class ScrobbleService : NotificationListenerService() {
    private data class Snapshot(
        val packageName: String,
        val artist: String,
        val title: String,
        val album: String?,
        val state: String,
        val positionMs: Long?,
        val durationMs: Long?,
        val priority: Int,
    ) {
        val dedupeKey: String
            get() = listOf(packageName, artist, title, album ?: "", state).joinToString("|")
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val heartbeatExecutor = Executors.newSingleThreadScheduledExecutor()
    private val callbacks = mutableMapOf<MediaController, MediaController.Callback>()

    private lateinit var sessionManager: MediaSessionManager
    private lateinit var listenerComponent: ComponentName
    private var lastSentKey: String? = null
    private var lastPublished: Snapshot? = null

    private val activeSessionsListener =
        MediaSessionManager.OnActiveSessionsChangedListener { controllers ->
            bindControllers(controllers ?: emptyList())
        }

    override fun onCreate() {
        super.onCreate()
        sessionManager = getSystemService(MediaSessionManager::class.java)
        listenerComponent = ComponentName(this, ScrobbleService::class.java)

        heartbeatExecutor.scheduleAtFixedRate(
            { mainHandler.post { publishBestSession(force = true) } },
            2,
            8,
            TimeUnit.SECONDS,
        )
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        runCatching {
            sessionManager.addOnActiveSessionsChangedListener(
                activeSessionsListener,
                listenerComponent,
            )
            bindControllers(sessionManager.getActiveSessions(listenerComponent))
        }
    }

    override fun onListenerDisconnected() {
        unbindControllers()
        runCatching {
            sessionManager.removeOnActiveSessionsChangedListener(activeSessionsListener)
        }
        requestRebind(listenerComponent)
        super.onListenerDisconnected()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        val posted = sbn ?: return
        if (posted.packageName !in TrackedApps.get(this)) return

        val notification = posted.notification ?: return
        val extras = notification.extras ?: return
        val looksLikeMedia =
            notification.category == Notification.CATEGORY_TRANSPORT ||
                extras.containsKey(Notification.EXTRA_MEDIA_SESSION)
        if (!looksLikeMedia) return

        val title = firstText(
            extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
            extras.getCharSequence(Notification.EXTRA_TITLE_BIG)?.toString(),
        )
        if (title.isBlank()) return

        val artist = firstText(
            extras.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
            extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString(),
        )
        val album = extras.getCharSequence(Notification.EXTRA_INFO_TEXT)
            ?.toString()
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

        val snapshot = Snapshot(
            packageName = posted.packageName,
            artist = artist,
            title = title,
            album = album,
            state = "playing",
            positionMs = null,
            durationMs = null,
            priority = 95,
        )
        if (lastSentKey == snapshot.dedupeKey) return
        lastSentKey = snapshot.dedupeKey
        lastPublished = snapshot
        send(snapshot)
    }

    private fun bindControllers(controllers: List<MediaController>) {
        unbindControllers()

        controllers.forEach { controller ->
            val callback = object : MediaController.Callback() {
                override fun onMetadataChanged(metadata: MediaMetadata?) {
                    publishBestSession(force = false)
                }

                override fun onPlaybackStateChanged(state: PlaybackState?) {
                    publishBestSession(force = false)
                }

                override fun onSessionDestroyed() {
                    mainHandler.post { refreshSessions() }
                }
            }
            controller.registerCallback(callback, mainHandler)
            callbacks[controller] = callback
        }

        publishBestSession(force = true)
    }

    private fun refreshSessions() {
        runCatching {
            bindControllers(sessionManager.getActiveSessions(listenerComponent))
        }
    }

    private fun unbindControllers() {
        callbacks.forEach { (controller, callback) ->
            runCatching { controller.unregisterCallback(callback) }
        }
        callbacks.clear()
    }

    private fun publishBestSession(force: Boolean) {
        val tracked = TrackedApps.get(this)
        val best = callbacks.keys
            .asSequence()
            .filter { it.packageName in tracked }
            .mapNotNull(::snapshot)
            .maxWithOrNull(
                compareBy<Snapshot> { it.priority }
                    .thenBy { it.positionMs ?: 0L },
            )

        if (best == null) {
            publishStoppedIfNeeded()
            return
        }

        if (!force && lastSentKey == best.dedupeKey) return
        lastSentKey = best.dedupeKey
        lastPublished = best
        send(best)
    }

    private fun publishStoppedIfNeeded() {
        val previous = lastPublished ?: return
        if (previous.state == "stopped") return

        val stopped = previous.copy(
            state = "stopped",
            positionMs = null,
            priority = 0,
        )
        lastSentKey = stopped.dedupeKey
        lastPublished = stopped
        send(stopped)
    }

    private fun snapshot(controller: MediaController): Snapshot? {
        val metadata = controller.metadata ?: return null
        val playback = controller.playbackState

        val title = firstText(
            metadata.getString(MediaMetadata.METADATA_KEY_TITLE),
            metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_TITLE)?.toString(),
        )
        if (title.isBlank()) return null

        val artist = firstText(
            metadata.getString(MediaMetadata.METADATA_KEY_ARTIST),
            metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST),
            metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)?.toString(),
        )
        val album = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM)
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

        val duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION)
            .takeIf { it > 0L }
        val position = playback?.position?.takeIf { it >= 0L }

        return Snapshot(
            packageName = controller.packageName,
            artist = artist,
            title = title,
            album = album,
            state = playbackStateName(playback?.state),
            positionMs = position,
            durationMs = duration,
            priority = playbackPriority(playback?.state),
        )
    }

    private fun send(snapshot: Snapshot) {
        val token = SecureStore.token(this) ?: return
        networkExecutor.execute {
            val ok = ApiClient.sendPlayback(
                token = token,
                packageName = snapshot.packageName,
                artist = snapshot.artist,
                title = snapshot.title,
                album = snapshot.album,
                state = snapshot.state,
                positionMs = snapshot.positionMs,
                durationMs = snapshot.durationMs,
            )
            if (ok) {
                SensorState.metadata(
                    this,
                    snapshot.title,
                    snapshot.artist,
                    snapshot.packageName,
                )
                sendBroadcast(Intent(CaptureService.ACTION_STATE).setPackage(packageName))
            } else {
                mainHandler.post {
                    if (lastSentKey == snapshot.dedupeKey) lastSentKey = null
                }
            }
        }
    }

    private fun playbackPriority(state: Int?): Int =
        when (state) {
            PlaybackState.STATE_PLAYING -> 100
            PlaybackState.STATE_BUFFERING,
            PlaybackState.STATE_CONNECTING -> 90
            PlaybackState.STATE_PAUSED -> 30
            PlaybackState.STATE_STOPPED,
            PlaybackState.STATE_NONE -> 10
            else -> 0
        }

    private fun playbackStateName(state: Int?): String =
        when (state) {
            PlaybackState.STATE_PLAYING -> "playing"
            PlaybackState.STATE_BUFFERING,
            PlaybackState.STATE_CONNECTING -> "buffering"
            PlaybackState.STATE_PAUSED -> "paused"
            PlaybackState.STATE_STOPPED,
            PlaybackState.STATE_NONE -> "stopped"
            else -> "paused"
        }

    private fun firstText(vararg values: String?): String =
        values.firstNotNullOfOrNull { value ->
            value?.trim()?.takeIf { it.isNotEmpty() }
        } ?: ""

    override fun onDestroy() {
        publishStoppedIfNeeded()
        unbindControllers()
        runCatching {
            sessionManager.removeOnActiveSessionsChangedListener(activeSessionsListener)
        }
        networkExecutor.shutdownNow()
        heartbeatExecutor.shutdownNow()
        super.onDestroy()
    }
}
