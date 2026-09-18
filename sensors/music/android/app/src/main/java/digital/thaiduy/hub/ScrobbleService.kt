package digital.thaiduy.hub

import android.content.ComponentName
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.service.notification.NotificationListenerService
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class ScrobbleService : NotificationListenerService() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val heartbeatExecutor = Executors.newSingleThreadScheduledExecutor()
    private val callbacks = mutableMapOf<MediaController, MediaController.Callback>()
    private val lastSent = ConcurrentHashMap<String, String>()

    private lateinit var sessionManager: MediaSessionManager
    private lateinit var listenerComponent: ComponentName

    private val activeSessionsListener =
        MediaSessionManager.OnActiveSessionsChangedListener { controllers ->
            bindControllers(controllers ?: emptyList())
        }

    override fun onCreate() {
        super.onCreate()
        sessionManager = getSystemService(MediaSessionManager::class.java)
        listenerComponent = ComponentName(this, ScrobbleService::class.java)

        heartbeatExecutor.scheduleAtFixedRate(
            { publishHeartbeat() },
            45,
            45,
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

    private fun bindControllers(controllers: List<MediaController>) {
        unbindControllers()

        controllers.forEach { controller ->
                val callback = object : MediaController.Callback() {
                    override fun onMetadataChanged(metadata: MediaMetadata?) {
                        publish(controller, force = false)
                    }

                    override fun onPlaybackStateChanged(state: PlaybackState?) {
                        publish(controller, force = false)
                    }

                    override fun onSessionDestroyed() {
                        mainHandler.post { refreshSessions() }
                    }
                }
                controller.registerCallback(callback, mainHandler)
                callbacks[controller] = callback
                publish(controller, force = true)
            }
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

    private fun publishHeartbeat() {
        mainHandler.post {
            callbacks.keys.forEach { controller ->
                val state = controller.playbackState?.state
                if (
                    state == PlaybackState.STATE_PLAYING ||
                    state == PlaybackState.STATE_BUFFERING ||
                    state == PlaybackState.STATE_CONNECTING
                ) {
                    publish(controller, force = true)
                }
            }
        }
    }

    private fun publish(controller: MediaController, force: Boolean) {
        val packageName = controller.packageName
        if (packageName !in TrackedApps.get(this)) return

        val metadata = controller.metadata ?: return
        val playback = controller.playbackState

        val title = firstText(
            metadata.getString(MediaMetadata.METADATA_KEY_TITLE),
            metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_TITLE)?.toString(),
        )
        if (title.isBlank()) return

        val artist = firstText(
            metadata.getString(MediaMetadata.METADATA_KEY_ARTIST),
            metadata.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST),
            metadata.getText(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)?.toString(),
        )
        val album = metadata.getString(MediaMetadata.METADATA_KEY_ALBUM)
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

        val state = playbackStateName(playback?.state)
        val duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION)
            .takeIf { it > 0L }
        val position = playback?.position?.takeIf { it >= 0L }

        val dedupeKey = listOf(packageName, artist, title, album ?: "", state).joinToString("|")
        if (!force && lastSent[packageName] == dedupeKey) return
        lastSent[packageName] = dedupeKey

        val token = SecureStore.token(this) ?: return
        networkExecutor.execute {
            ApiClient.sendPlayback(
                token = token,
                packageName = packageName,
                artist = artist,
                title = title,
                album = album,
                state = state,
                positionMs = position,
                durationMs = duration,
            )
        }
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
        unbindControllers()
        runCatching {
            sessionManager.removeOnActiveSessionsChangedListener(activeSessionsListener)
        }
        networkExecutor.shutdownNow()
        heartbeatExecutor.shutdownNow()
        super.onDestroy()
    }
}
