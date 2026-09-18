package digital.thaiduy.hub

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class AppSelectionActivity : Activity() {
    private data class Candidate(
        val packageName: String,
        val label: String,
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(10, 13, 12)
        window.navigationBarColor = Color.rgb(10, 13, 12)

        val selected = TrackedApps.get(this).toMutableSet()
        val candidates = loadCandidates()
        val checkboxes = mutableMapOf<String, CheckBox>()

        val scroll = ScrollView(this).apply {
            setBackgroundColor(Color.rgb(10, 13, 12))
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(22), dp(28), dp(22), dp(28))
        }
        scroll.addView(root, ViewGroup.LayoutParams(-1, -2))

        root.addView(label("THÁI DUY HUB / TRACKED APPS", 11, Color.rgb(142, 232, 178)))
        root.addView(label("Choose media apps", 28, Color.WHITE).apply {
            setPadding(0, dp(8), 0, dp(8))
        })
        root.addView(label(
            "Only selected apps are read from Android media sessions. " +
                "No notification text is uploaded.",
            13,
            Color.rgb(151, 163, 156),
        ).apply { setPadding(0, 0, 0, dp(18)) })

        for (candidate in candidates) {
            val box = CheckBox(this).apply {
                text = candidate.label + "\n" + candidate.packageName
                textSize = 13f
                typeface = Typeface.MONOSPACE
                setTextColor(Color.rgb(220, 229, 223))
                isChecked = candidate.packageName in selected
                setPadding(0, dp(8), 0, dp(8))
                setOnCheckedChangeListener { _, checked ->
                    if (checked) selected.add(candidate.packageName)
                    else selected.remove(candidate.packageName)
                }
            }
            checkboxes[candidate.packageName] = box
            root.addView(box)
        }

        val save = Button(this).apply {
            text = "SAVE TRACKED APPS"
            textSize = 12f
            typeface = Typeface.MONOSPACE
            isAllCaps = false
            setTextColor(Color.rgb(220, 229, 223))
            setBackgroundColor(Color.rgb(25, 31, 28))
            setOnClickListener {
                TrackedApps.save(this@AppSelectionActivity, selected)
                NotificationListenerService.requestRebind(
                    ComponentName(this@AppSelectionActivity, ScrobbleService::class.java),
                )
                setResult(RESULT_OK)
                finish()
            }
        }
        root.addView(save, LinearLayout.LayoutParams(-1, dp(58)).apply {
            topMargin = dp(22)
        })

        setContentView(scroll)
    }

    private fun loadCandidates(): List<Candidate> {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val flags = if (android.os.Build.VERSION.SDK_INT >= 33) {
            PackageManager.ResolveInfoFlags.of(0)
        } else null

        @Suppress("DEPRECATION")
        val resolved = if (flags != null) {
            packageManager.queryIntentActivities(intent, flags)
        } else {
            packageManager.queryIntentActivities(intent, 0)
        }

        return resolved
            .asSequence()
            .mapNotNull { info ->
                val packageName = info.activityInfo?.packageName ?: return@mapNotNull null
                if (packageName == this.packageName) return@mapNotNull null
                val label = info.loadLabel(packageManager)?.toString()?.trim()
                    ?.takeIf { it.isNotEmpty() }
                    ?: packageName
                Candidate(packageName, label)
            }
            .distinctBy { it.packageName }
            .sortedBy { it.label.lowercase() }
            .toList()
    }

    private fun label(text: String, size: Int, color: Int) = TextView(this).apply {
        this.text = text
        textSize = size.toFloat()
        setTextColor(color)
        typeface = Typeface.MONOSPACE
        setLineSpacing(0f, 1.15f)
    }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()
}
