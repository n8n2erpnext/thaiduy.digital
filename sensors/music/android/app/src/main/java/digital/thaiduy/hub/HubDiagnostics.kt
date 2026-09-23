package digital.thaiduy.hub

import android.content.Context

object HubDiagnostics {
    private const val PREFS = "thaiduy_hub_diagnostics"
    private const val STAGE = "stage"
    private const val ERROR = "error"
    private const val AT = "at"

    fun mark(context: Context, stage: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(STAGE, stage.take(80))
            .putLong(AT, System.currentTimeMillis())
            .remove(ERROR)
            .apply()
    }

    fun error(context: Context, stage: String, throwable: Throwable? = null) {
        val detail = throwable?.let {
            (it::class.java.simpleName + ": " + (it.message ?: "no message")).take(240)
        } ?: "unknown"
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(STAGE, stage.take(80))
            .putString(ERROR, detail)
            .putLong(AT, System.currentTimeMillis())
            .apply()
    }

    fun summary(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val stage = prefs.getString(STAGE, null) ?: return "No diagnostic event yet."
        val error = prefs.getString(ERROR, null)
        return if (error.isNullOrBlank()) "Last stage: $stage" else "Last error at $stage · $error"
    }
}
