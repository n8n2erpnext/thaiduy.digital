package digital.thaiduy.hub

import android.content.Context
import android.content.pm.PackageManager

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

    fun uids(context: Context): Set<Int> =
        get(context).mapNotNullTo(linkedSetOf()) { packageName ->
            runCatching {
                if (android.os.Build.VERSION.SDK_INT >= 33) {
                    context.packageManager.getApplicationInfo(
                        packageName,
                        PackageManager.ApplicationInfoFlags.of(0),
                    ).uid
                } else {
                    @Suppress("DEPRECATION")
                    context.packageManager.getApplicationInfo(packageName, 0).uid
                }
            }.getOrNull()
        }
}
