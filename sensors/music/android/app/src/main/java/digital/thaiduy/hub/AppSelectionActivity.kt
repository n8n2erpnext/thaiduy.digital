package digital.thaiduy.hub

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class AppSelectionActivity : Activity() {
    companion object {
        private const val BG = 0xFFF1F3EF.toInt()
        private const val CARD = 0xFFF9FAF7.toInt()
        private const val INK = 0xFF171A18.toInt()
        private const val MUTED = 0xFF707A74.toInt()
        private const val LINE = 0xFFDDE2DD.toInt()
        private const val SOFT = 0xFFE2EEE8.toInt()
    }

    private data class Candidate(
        val packageName: String,
        val label: String,
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = BG
        window.navigationBarColor = BG
        if (android.os.Build.VERSION.SDK_INT >= 23) {
            window.decorView.systemUiVisibility =
                android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or
                    android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
        setContentView(buildUi())
    }

    private fun buildUi(): ScrollView {
        val selected = TrackedApps.get(this).toMutableSet()
        val candidates = loadCandidates()

        val scroll = ScrollView(this).apply {
            setBackgroundColor(BG)
            isFillViewport = true
        }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(20), dp(20), dp(30))
        }
        scroll.addView(root, ViewGroup.LayoutParams(-1, -2))

        root.addView(kicker("MUSIC SENSOR / SOURCE"))
        root.addView(label("Choose playback\nsource apps.", 29, INK, bold = true).apply {
            setPadding(0, dp(8), 0, dp(8))
            setLineSpacing(0f, .96f)
        })
        root.addView(label(
            "Metadata and Live DSP are restricted to the apps selected here. " +
                "Audio is sent as AAC 128 kbps over TLS for transient server analysis and is not persisted.",
            13,
            MUTED,
        ).apply { setLineSpacing(0f, 1.18f) })

        val status = label("", 10, MUTED, mono = true).apply {
            setPadding(0, dp(18), 0, dp(8))
        }
        root.addView(status)

        fun refreshStatus() {
            status.text = if (selected.isEmpty()) {
                "○ NO SOURCE SELECTED"
            } else {
                "● " + selected.size + " SOURCE APP(S) SELECTED"
            }
            status.setTextColor(if (selected.isEmpty()) MUTED else 0xFF4FAE82.toInt())
        }
        refreshStatus()

        if (candidates.isEmpty()) {
            root.addView(card().apply {
                addView(label("NO LAUNCHABLE APPS FOUND", 12, INK, bold = true))
                addView(label(
                    "Android did not return any launcher apps. Reopen the Hub after your music apps are installed.",
                    12,
                    MUTED,
                ).apply { setPadding(0, dp(7), 0, 0) })
            })
        }

        candidates.forEach { candidate ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                background = rounded(CARD, 20f)
                setPadding(dp(12), dp(10), dp(8), dp(10))
            }

            val icon = ImageView(this).apply {
                scaleType = ImageView.ScaleType.CENTER_INSIDE
                setImageDrawable(runCatching {
                    packageManager.getApplicationIcon(candidate.packageName)
                }.getOrNull())
            }
            row.addView(icon, LinearLayout.LayoutParams(dp(42), dp(42)).apply {
                rightMargin = dp(12)
            })

            val copy = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                addView(label(candidate.label, 14, INK, bold = true))
                addView(label(candidate.packageName, 9, MUTED, mono = true).apply {
                    setPadding(0, dp(3), 0, 0)
                })
            }
            row.addView(copy, LinearLayout.LayoutParams(0, -2, 1f))

            val box = CheckBox(this).apply {
                isChecked = candidate.packageName in selected
                buttonTintList = android.content.res.ColorStateList(
                    arrayOf(
                        intArrayOf(android.R.attr.state_checked),
                        intArrayOf(),
                    ),
                    intArrayOf(0xFF171A18.toInt(), 0xFFA7AFA9.toInt()),
                )
                setOnCheckedChangeListener { _, checked ->
                    if (checked) selected.add(candidate.packageName)
                    else selected.remove(candidate.packageName)
                    refreshStatus()
                }
            }
            row.addView(box, LinearLayout.LayoutParams(dp(48), dp(48)))

            root.addView(row, LinearLayout.LayoutParams(-1, -2).apply {
                topMargin = dp(8)
            })
        }

        root.addView(Button(this).apply {
            text = "SAVE SOURCE APPS"
            isAllCaps = false
            textSize = 12f
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            setTextColor(Color.WHITE)
            background = rounded(INK, 16f)
            setOnClickListener {
                TrackedApps.save(this@AppSelectionActivity, selected)
                NotificationListenerService.requestRebind(
                    ComponentName(this@AppSelectionActivity, ScrobbleService::class.java),
                )
                setResult(RESULT_OK)
                finish()
            }
        }, LinearLayout.LayoutParams(-1, dp(54)).apply {
            topMargin = dp(18)
        })

        root.addView(label(
            "Some DRM-protected apps may expose track metadata while blocking Android playback capture. " +
                "In that case Scrobble stays active but Live DSP will show no capturable signal.",
            10,
            MUTED,
        ).apply { setPadding(0, dp(12), 0, 0) })

        return scroll
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

        return resolved.asSequence()
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

    private fun card(): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(CARD, 20f)
            setPadding(dp(14), dp(14), dp(14), dp(14))
        }

    private fun kicker(text: String): TextView =
        label(text, 9, MUTED, mono = true, bold = true).apply {
            letterSpacing = .12f
        }

    private fun label(
        text: String,
        size: Int,
        color: Int,
        mono: Boolean = false,
        bold: Boolean = false,
    ) = TextView(this).apply {
        this.text = text
        textSize = size.toFloat()
        setTextColor(color)
        typeface = if (mono) {
            Typeface.create(Typeface.MONOSPACE, if (bold) Typeface.BOLD else Typeface.NORMAL)
        } else {
            Typeface.create(Typeface.SANS_SERIF, if (bold) Typeface.BOLD else Typeface.NORMAL)
        }
    }

    private fun rounded(color: Int, radiusDp: Float): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(color)
            cornerRadius = dp(radiusDp.toInt()).toFloat()
            setStroke(dp(1), LINE)
        }

    private fun dp(value: Int): Int =
        (value * resources.displayMetrics.density).toInt()
}
