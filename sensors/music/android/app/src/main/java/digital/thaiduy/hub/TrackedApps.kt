package digital.thaiduy.hub

import android.content.Context

object TrackedApps {
    private const val PREFS = "thaiduy_hub"
    private const val KEY = "tracked_media_packages"

    fun get(context: Context): Set<String> =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getStringSet(KEY, emptySet())
            ?.toSet()
            ?: emptySet()

    fun save(context: Context, packages: Set<String>) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putStringSet(KEY, packages)
            .apply()
    }
}
