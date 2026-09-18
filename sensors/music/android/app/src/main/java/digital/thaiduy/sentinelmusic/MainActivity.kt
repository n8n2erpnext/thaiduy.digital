package digital.thaiduy.sentinelmusic

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
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
        private const val REQUEST_AUDIO = 2001
        private const val REQUEST_PROJECTION = 2002
        private const val REQUEST_NOTIFICATIONS = 2003
    }

    private lateinit var status: TextView
    private lateinit var pairCode: EditText
    private lateinit var pairButton: Button
    private lateinit var startButton: Button
    private var pendingStart = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(10, 13, 12)
        window.navigationBarColor = Color.rgb(10, 13, 12)
        setContentView(buildUi())
        refreshStatus()

        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                REQUEST_NOTIFICATIONS,
            )
        }
    }

    private fun buildUi(): ScrollView {
        val scroll = ScrollView(this).apply {
            setBackgroundColor(Color.rgb(10, 13, 12))
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(36), dp(24), dp(36))
        }
        scroll.addView(root, ViewGroup.LayoutParams(-1, -2))

        root.addView(label("SENTINEL / MUSIC SENSOR", 12, Color.rgb(142, 232, 178)))
        root.addView(label("Android playback ear", 30, Color.WHITE).apply {
            setPadding(0, dp(10), 0, dp(8))
        })
        root.addView(label(
            "Local playback analysis for thaiduy.digital. Raw audio never leaves this device.",
            14,
            Color.rgb(151, 163, 156),
        ))

        status = label("", 12, Color.rgb(142, 232, 178)).apply {
            setPadding(0, dp(28), 0, dp(12))
        }
        root.addView(status)

        root.addView(label("PAIR CODE", 10, Color.rgb(112, 124, 117)))
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

        startButton = actionButton("START LISTENING") { beginListening() }
        root.addView(startButton, LinearLayout.LayoutParams(-1, dp(58)).apply {
            topMargin = dp(26)
        })

        root.addView(actionButton("STOP SENSOR") {
            startService(
                Intent(this, CaptureService::class.java)
                    .setAction(CaptureService.ACTION_STOP),
            )
            setStatus("SENSOR STOPPED", false)
        })

        root.addView(label(
            "Android will ask for playback-capture consent every new listening session. " +
                "This app never uses the microphone as a fallback.",
            11,
            Color.rgb(105, 117, 110),
        ).apply { setPadding(0, dp(22), 0, 0) })

        return scroll
    }

    private fun pairDevice() {
        val code = pairCode.text.toString().trim()
        if (code.length != 6) {
            setStatus("ENTER THE 6-DIGIT CODE FROM /CONTROL/MUSIC-SENSOR", false)
            return
        }
        pairButton.isEnabled = false
        setStatus("PAIRING…", true)

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
                    setStatus("PAIRING FAILED · CREATE A NEW CODE AND TRY AGAIN", false)
                }
            }
        }.start()
    }

    private fun beginListening() {
        if (SecureStore.token(this) == null) {
            setStatus("PAIR THIS DEVICE FIRST", false)
            return
        }

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingStart = true
            requestPermissions(
                arrayOf(Manifest.permission.RECORD_AUDIO),
                REQUEST_AUDIO,
            )
            return
        }

        requestProjection()
    }

    private fun requestProjection() {
        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(
            manager.createScreenCaptureIntent(),
            REQUEST_PROJECTION,
        )
    }

    @Deprecated("Legacy result callback is sufficient for minSdk 29.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQUEST_PROJECTION) return

        if (resultCode != RESULT_OK || data == null) {
            setStatus("PLAYBACK CAPTURE NOT GRANTED", false)
            return
        }

        val service = Intent(this, CaptureService::class.java)
            .setAction(CaptureService.ACTION_START)
            .putExtra(CaptureService.EXTRA_RESULT_CODE, resultCode)
            .putExtra(CaptureService.EXTRA_PROJECTION_DATA, data)

        startForegroundService(service)
        setStatus("LISTENING · LOCAL DSP ACTIVE", true)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == REQUEST_AUDIO && pendingStart) {
            pendingStart = false
            if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
                requestProjection()
            } else {
                setStatus("RECORD_AUDIO PERMISSION IS REQUIRED BY PLAYBACK CAPTURE", false)
            }
        }
    }

    private fun refreshStatus() {
        val paired = SecureStore.token(this) != null
        setStatus(if (paired) "PAIRED · READY" else "NOT PAIRED", paired)
        pairButton.text = if (paired) "PAIR AGAIN / REPLACE TOKEN" else "PAIR DEVICE"
        startButton.isEnabled = paired
    }

    private fun setStatus(text: String, good: Boolean) {
        status.text = text
        status.setTextColor(
            if (good) Color.rgb(142, 232, 178)
            else Color.rgb(220, 142, 126),
        )
    }

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
