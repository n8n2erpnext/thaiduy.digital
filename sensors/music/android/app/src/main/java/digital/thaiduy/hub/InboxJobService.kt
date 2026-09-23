package digital.thaiduy.hub

import android.app.Notification
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class InboxJobService : JobService() {
    override fun onStartJob(params: JobParameters): Boolean {
        Thread {
            runCatching { syncInbox(this) }
            jobFinished(params, false)
        }.start()
        return true
    }

    override fun onStopJob(params: JobParameters): Boolean = true

    private fun syncInbox(context: Context) {
        val token = SecureStore.token(context) ?: return
        val result = ApiClient.fetchInbox(token, limit = 20)
        InboxNotifications.process(context, result)
    }
}

object InboxScheduler {
    private const val JOB_ID = 4212
    private const val FIFTEEN_MINUTES = 15 * 60 * 1000L

    fun schedule(context: Context) {
        if (SecureStore.token(context) == null) return
        val scheduler = context.getSystemService(JobScheduler::class.java)
        val info = JobInfo.Builder(
            JOB_ID,
            ComponentName(context, InboxJobService::class.java),
        )
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(FIFTEEN_MINUTES)
            .setPersisted(true)
            .build()
        scheduler.schedule(info)
    }
}

object InboxNotifications {
    private const val PREFS = "thaiduy_hub_inbox"
    private const val LAST_ID = "last_contact_id"
    private const val CHANNEL = "thaiduy_hub_inbox"
    private const val NOTIFICATION_ID = 4213

    fun process(context: Context, result: InboxResult) {
        val newest = result.messages.firstOrNull() ?: return
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val previous = prefs.getString(LAST_ID, null)
        prefs.edit().putString(LAST_ID, newest.id).apply()

        if (previous == null || previous == newest.id || newest.status != "new") return

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL,
                "Thái Duy Hub · Inbox",
                NotificationManager.IMPORTANCE_DEFAULT,
            ),
        )

        val open = Intent(context, MainActivity::class.java)
            .putExtra(MainActivity.EXTRA_OPEN_TAB, "inbox")
        val pending = PendingIntent.getActivity(
            context,
            4213,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = Notification.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle("New message from " + newest.name)
            .setContentText(newest.message.take(120))
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
        manager.notify(NOTIFICATION_ID, notification)
    }
}
