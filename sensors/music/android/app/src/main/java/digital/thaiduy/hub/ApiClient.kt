package digital.thaiduy.hub

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

data class PairResult(val token: String, val deviceId: String)

object ApiClient {
    private const val BASE = "https://thaiduy.digital"

    private fun connection(path: String): HttpURLConnection =
        (URL(BASE + path).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 4_000
            readTimeout = 4_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
        }

    fun pair(code: String, name: String): PairResult {
        val payload = JSONObject()
            .put("code", code)
            .put("name", name)
            .put("platform", "android")
            .toString()

        val conn = connection("/api/hub/pair")
        conn.outputStream.use { it.write(payload.toByteArray()) }
        if (conn.responseCode !in 200..299) {
            conn.disconnect()
            error("Pairing failed")
        }
        val body = conn.inputStream.bufferedReader().use { it.readText() }
        conn.disconnect()
        val json = JSONObject(body)
        return PairResult(
            token = json.getString("token"),
            deviceId = json.getString("deviceId"),
        )
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

        return runCatching {
            val conn = connection("/api/hub/music/playback")
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.outputStream.use { it.write(payload.toString().toByteArray()) }
            val ok = conn.responseCode == 202
            conn.disconnect()
            ok
        }.getOrDefault(false)
    }


}
