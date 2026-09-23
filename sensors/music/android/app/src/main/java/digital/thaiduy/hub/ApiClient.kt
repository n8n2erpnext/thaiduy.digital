package digital.thaiduy.hub

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.Instant

data class PairResult(
    val token: String,
    val deviceId: String,
    val scopes: List<String>,
    val ownerEmail: String?,
)

data class ContactMessage(
    val id: String,
    val name: String,
    val email: String,
    val phone: String?,
    val message: String,
    val locale: String,
    val status: String,
    val createdAt: String,
)

data class InboxResult(
    val messages: List<ContactMessage>,
    val newCount: Int,
    val latestAt: String?,
)

object ApiClient {
    private const val BASE = "https://thaiduy.digital"

    private fun connection(path: String, method: String): HttpURLConnection =
        (URL(BASE + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 4_000
            readTimeout = 6_000
            setRequestProperty("Accept", "application/json")
            if (method != "GET") {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
        }

    fun pair(code: String, name: String): PairResult {
        val payload = JSONObject()
            .put("code", code)
            .put("name", name)
            .put("platform", "android")
            .toString()

        val conn = connection("/api/hub/pair", "POST")
        conn.outputStream.use { it.write(payload.toByteArray()) }
        if (conn.responseCode !in 200..299) {
            conn.disconnect()
            error("Pairing failed")
        }
        val body = conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
        val json = JSONObject(body)
        val scopes = buildList {
            val values = json.optJSONArray("scopes")
            if (values != null) {
                for (index in 0 until values.length()) add(values.getString(index))
            }
        }
        return PairResult(
            token = json.getString("token"),
            deviceId = json.getString("deviceId"),
            scopes = scopes,
            ownerEmail = json.optString("ownerEmail").takeIf { it.isNotBlank() },
        )
    }

    fun controlBootstrap(token: String): String {
        val conn = connection("/api/hub/control/session", "POST")
        conn.setRequestProperty("Authorization", "Bearer $token")
        conn.outputStream.use { it.write("{}".toByteArray()) }
        val code = conn.responseCode
        if (code !in 200..299) {
            runCatching { conn.errorStream?.close() }
            conn.disconnect()
            error(if (code == 401 || code == 403) "Re-pair Hub to enable Control" else "Control session unavailable")
        }
        val body = conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
        return JSONObject(body).getString("bootstrapUrl")
    }

    fun sendPlayback(
        token: String,
        packageName: String,
        artist: String,
        title: String,
        album: String?,
        state: String,
        positionMs: Long?,
        durationMs: Long?,
    ): Boolean {
        val payload = JSONObject()
            .put("packageName", packageName)
            .put("artist", artist)
            .put("title", title)
            .put("state", state)
            .put("at", Instant.now().toString())

        if (!album.isNullOrBlank()) payload.put("album", album)
        if (positionMs != null && positionMs >= 0) payload.put("positionMs", positionMs)
        if (durationMs != null && durationMs > 0) payload.put("durationMs", durationMs)

        return postAuthorized("/api/hub/music/playback", token, payload) == 202
    }

    fun sendFrame(
        token: String,
        deviceId: String,
        seq: Long,
        sampleRate: Int,
        windowMs: Int,
        features: DspFeatures,
    ): Boolean {
        val payload = JSONObject()
            .put("deviceId", deviceId)
            .put("seq", seq)
            .put("at", Instant.now().toString())
            .put("sampleRate", sampleRate)
            .put("windowMs", windowMs)
            .put("rms", features.rms)
            .put("peak", features.peak)
            .put("bass", features.bass)
            .put("lowMid", features.lowMid)
            .put("mid", features.mid)
            .put("presence", features.presence)
            .put("air", features.air)
            .put("spectralFlux", features.spectralFlux)
            .put("spectralCentroid", features.spectralCentroid)

        return postAuthorized("/api/music/sensor/ingest", token, payload) == 202
    }

    fun fetchInbox(token: String, after: String? = null, limit: Int = 20): InboxResult {
        val safeLimit = limit.coerceIn(1, 50)
        val path = buildString {
            append("/api/hub/inbox?limit=")
            append(safeLimit)
            if (!after.isNullOrBlank()) {
                append("&after=")
                append(URLEncoder.encode(after, "UTF-8"))
            }
        }
        val conn = connection(path, "GET")
        conn.setRequestProperty("Authorization", "Bearer $token")
        if (conn.responseCode !in 200..299) {
            conn.disconnect()
            error("Inbox fetch failed")
        }
        val body = conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
        val json = JSONObject(body)
        val values = json.getJSONArray("messages")
        val messages = buildList {
            for (index in 0 until values.length()) {
                val item = values.getJSONObject(index)
                add(
                    ContactMessage(
                        id = item.getString("id"),
                        name = item.getString("name"),
                        email = item.getString("email"),
                        phone = if (item.isNull("phone")) null else item.getString("phone"),
                        message = item.getString("message"),
                        locale = item.optString("locale", "en"),
                        status = item.optString("status", "new"),
                        createdAt = item.getString("createdAt"),
                    ),
                )
            }
        }
        return InboxResult(
            messages = messages,
            newCount = json.optInt("newCount", 0),
            latestAt = if (json.isNull("latestAt")) null else json.optString("latestAt"),
        )
    }

    private fun postAuthorized(path: String, token: String, payload: JSONObject): Int =
        runCatching {
            val conn = connection(path, "POST")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.outputStream.use { it.write(payload.toString().toByteArray()) }
            val code = conn.responseCode
            conn.disconnect()
            code
        }.getOrDefault(0)
}
