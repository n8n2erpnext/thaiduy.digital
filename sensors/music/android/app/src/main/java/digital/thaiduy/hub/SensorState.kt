package digital.thaiduy.hub

import android.content.Context

object SensorState {
    private const val PREFS = "thaiduy_hub_sensor"
    private const val RUNNING = "running"
    private const val LAST_FRAME_AT = "last_frame_at"
    private const val LAST_ERROR = "last_error"
    private const val LAST_RMS = "last_rms"
    private const val LAST_PEAK = "last_peak"
    private const val LAST_METADATA_AT = "last_metadata_at"
    private const val LAST_TITLE = "last_title"
    private const val LAST_ARTIST = "last_artist"
    private const val LAST_PACKAGE = "last_package"

    fun setRunning(context: Context, running: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(RUNNING, running)
            .apply()
    }

    fun running(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getBoolean(RUNNING, false)

    fun frame(context: Context, features: DspFeatures) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putLong(LAST_FRAME_AT, System.currentTimeMillis())
            .putFloat(LAST_RMS, features.rms)
            .putFloat(LAST_PEAK, features.peak)
            .remove(LAST_ERROR)
            .apply()
    }

    fun error(context: Context, message: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(LAST_ERROR, message)
            .apply()
    }

    fun lastFrameAt(context: Context): Long =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getLong(LAST_FRAME_AT, 0L)

    fun lastError(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(LAST_ERROR, null)

    fun lastRms(context: Context): Float =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getFloat(LAST_RMS, 0f)

    fun lastPeak(context: Context): Float =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getFloat(LAST_PEAK, 0f)

    fun metadata(context: Context, title: String, artist: String, packageName: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putLong(LAST_METADATA_AT, System.currentTimeMillis())
            .putString(LAST_TITLE, title)
            .putString(LAST_ARTIST, artist)
            .putString(LAST_PACKAGE, packageName)
            .apply()
    }

    fun lastMetadataAt(context: Context): Long =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getLong(LAST_METADATA_AT, 0L)

    fun lastTitle(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(LAST_TITLE, null)

    fun lastArtist(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(LAST_ARTIST, null)

    fun lastMetadataPackage(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(LAST_PACKAGE, null)
}
