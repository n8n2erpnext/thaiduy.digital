package digital.thaiduy.hub

import android.app.Activity
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.InputFilter
import android.text.InputType
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class MainActivity : Activity() {
    companion object {
        private const val REQUEST_NOTIFICATIONS = 2003
    }

    private lateinit var hubStatus: TextView
    private lateinit var scrobbleStatus: TextView
    private lateinit var pairCode: EditText
    private lateinit var pairButton: Button
    private lateinit var trackedAppsButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(10, 13, 12)
        window.navigationBarColor = Color.rgb(10, 13, 12)
        setContentView(buildUi())

        if (
            Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                REQUEST_NOTIFICATIONS,
            )
        }
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    private fun buildUi(): ScrollView {
        val scroll = ScrollView(this).apply {
            setBackgroundColor(Color.rgb(10, 13, 12))
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(32), dp(24), dp(36))
        }
        scroll.addView(root, ViewGroup.LayoutParams(-1, -2))

        root.addView(label("THÁI DUY / HUB", 11, Color.rgb(246, 131, 48)))
        root.addView(label("Private control surface", 30, Color.WHITE).apply {
            setPadding(0, dp(8), 0, dp(8))
        })
        root.addView(label(
            "Background media sensing and a future scoped control surface for thaiduy.digital.",
            13,
            Color.rgb(151, 163, 156),
        ))

        hubStatus = label("", 12, Color.rgb(142, 232, 178)).apply {
            setPadding(0, dp(24), 0, dp(12))
        }
        root.addView(hubStatus)

        root.addView(sectionTitle("PAIR HUB DEVICE"))
        pairCode = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_NUMBER
            filters = arrayOf(InputFilter.LengthFilter(6))
            hint = "000000"
            setTextColor(Color.WHITE)
            setHintTextColor(Color.rgb(78, 88, 82))
            typeface = Typeface.MONOSPACE
            textSize = 24f
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(18, 23, 20))
            setPadding(dp(14), dp(12), dp(14), dp(12))
        }
        root.addView(pairCode, LinearLayout.LayoutParams(-1, dp(62)).apply {
            bottomMargin = dp(10)
        })

        pairButton = actionButton("PAIR DEVICE") { pairDevice() }
        root.addView(pairButton)

        root.addView(sectionTitle("MUSIC SENSOR").apply {
            setPadding(0, dp(30), 0, dp(8))
        })

        scrobbleStatus = label("", 12, Color.rgb(151, 163, 156))
        root.addView(scrobbleStatus)

        root.addView(actionButton("ENABLE / MANAGE NOTIFICATION ACCESS") {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }, LinearLayout.LayoutParams(-1, dp(54)).apply {
            topMargin = dp(10)
        })

        trackedAppsButton = actionButton("SELECT TRACKED APPS") {
            startActivity(Intent(this, AppSelectionActivity::class.java))
        }
        root.addView(trackedAppsButton, LinearLayout.LayoutParams(-1, dp(54)).apply {
            topMargin = dp(8)
        })

        root.addView(label(
            "SCROBBLE MODE · DEFAULT\nRuns in the background using Android media sessions. No screen-share prompt and no raw audio upload.",
            11,
            Color.rgb(105, 117, 110),
        ).apply { setPadding(0, dp(12), 0, dp(18)) })

        root.addView(sectionTitle("WEB CONTROL").apply {
            setPadding(0, dp(30), 0, dp(8))
        })
        root.addView(actionButton("OPEN THAIDUY.DIGITAL CONTROL") {
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://thaiduy.digital/control"),
                ),
            )
        }, LinearLayout.LayoutParams(-1, dp(54)))

        root.addView(label(
            "Native Hub controls will use separate owner-approved scopes. The Music Sensor token can never mutate site content or runtime settings.",
            11,
            Color.rgb(105, 117, 110),
        ).apply { setPadding(0, dp(12), 0, 0) })

        return scroll
    }

    private fun pairDevice() {
        val code = pairCode.text.toString().trim()
        if (code.length != 6) {
            setHubStatus("ENTER THE 6-DIGIT CODE FROM /CONTROL/MUSIC-SENSOR", false)
            return
        }

        pairButton.isEnabled = false
        setHubStatus("PAIRING…", true)

        Thread {
            val result = runCatching {
                ApiClient.pair(
                    code,
                    (Build.MANUFACTURER + " " + Build.MODEL).trim(),
                )
            }
            runOnUiThread {
                pairButton.isEnabled = true
                result.onSuccess {
                    SecureStore.save(this, it.token, it.deviceId)
                    pairCode.text.clear()
                    refreshStatus()
                }.onFailure {
                    setHubStatus("PAIRING FAILED · CREATE A NEW CODE AND TRY AGAIN", false)
                }
            }
        }.start()
    }

    private fun refreshStatus() {
        val paired = SecureStore.token(this) != null
        val notificationAccess = notificationAccessGranted()
        val trackedCount = TrackedApps.get(this).size

        setHubStatus(
            if (paired) "HUB DEVICE · PAIRED" else "HUB DEVICE · NOT PAIRED",
            paired,
        )
        pairButton.text = if (paired) "PAIR AGAIN / REPLACE TOKEN" else "PAIR DEVICE"
        trackedAppsButton.isEnabled = true

        scrobbleStatus.text = buildString {
            append(if (notificationAccess) "BACKGROUND SCROBBLE · READY" else "BACKGROUND SCROBBLE · ACCESS REQUIRED")
            append("\nTRACKED APPS · ")
            append(trackedCount)
            if (!paired) append("\nPAIRING REQUIRED BEFORE SYNC")
        }
        scrobbleStatus.setTextColor(
            if (notificationAccess && trackedCount > 0 && paired) {
                Color.rgb(142, 232, 178)
            } else {
                Color.rgb(151, 163, 156)
            },
        )
    }

    private fun notificationAccessGranted(): Boolean {
        val manager = getSystemService(NotificationManager::class.java)
        return manager.isNotificationListenerAccessGranted(
            ComponentName(this, ScrobbleService::class.java),
        )
    }

    private fun setHubStatus(text: String, good: Boolean) {
        hubStatus.text = text
        hubStatus.setTextColor(
            if (good) Color.rgb(142, 232, 178)
            else Color.rgb(220, 142, 126),
        )
    }

    private fun sectionTitle(text: String) =
        label(text, 10, Color.rgb(112, 124, 117))

    private fun label(text: String, size: Int, color: Int) = TextView(this).apply {
        this.text = text
        textSize = size.toFloat()
        setTextColor(color)
        typeface = Typeface.MONOSPACE
        setLineSpacing(0f, 1.15f)
    }

    private fun actionButton(text: String, action: () -> Unit) = Button(this).apply {
        this.text = text
        textSize = 12f
        typeface = Typeface.MONOSPACE
        isAllCaps = false
        setTextColor(Color.rgb(220, 229, 223))
        setBackgroundColor(Color.rgb(25, 31, 28))
        setOnClickListener { action() }
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()
}
