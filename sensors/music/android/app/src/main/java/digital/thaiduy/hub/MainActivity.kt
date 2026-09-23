package digital.thaiduy.hub

import android.Manifest
import android.app.Activity
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.InputFilter
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView

class MainActivity : Activity() {
    companion object {
        const val EXTRA_OPEN_TAB = "open_tab"
        private const val REQUEST_AUDIO = 2001
        private const val REQUEST_PROJECTION = 2002
        private const val REQUEST_NOTIFICATIONS = 2003
        private const val BG = 0xFFF1F3EF.toInt()
        private const val CARD = 0xFFF9FAF7.toInt()
        private const val INK = 0xFF171A18.toInt()
        private const val MUTED = 0xFF707A74.toInt()
        private const val LINE = 0xFFDDE2DD.toInt()
        private const val ACCENT = 0xFFF68330.toInt()
        private const val LIVE = 0xFF4FAE82.toInt()
        private const val SOFT = 0xFFE2EEE8.toInt()
    }

    private lateinit var content: FrameLayout
    private lateinit var nav: LinearLayout
    private val navItems = linkedMapOf<String, LinearLayout>()
    private var selectedTab = "home"
    private var pendingStart = false
    private var webView: WebView? = null
    private var pairCode: EditText? = null
    private var pairButton: Button? = null

    private val dspStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (selectedTab == "sensor" || selectedTab == "home") showTab(selectedTab)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = BG
        window.navigationBarColor = BG
        if (Build.VERSION.SDK_INT >= 23) {
            window.decorView.systemUiVisibility =
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
        setContentView(buildShell())
        registerDspReceiver()
        InboxScheduler.schedule(this)
        if (SecureStore.token(this) != null) requestNotificationPermissionIfNeeded()
        showTab(intent.getStringExtra(EXTRA_OPEN_TAB) ?: "home")
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        showTab(intent?.getStringExtra(EXTRA_OPEN_TAB) ?: selectedTab)
    }

    override fun onResume() {
        super.onResume()
        if (selectedTab != "control") showTab(selectedTab)
    }

    override fun onDestroy() {
        runCatching { unregisterReceiver(dspStateReceiver) }
        webView?.destroy()
        webView = null
        super.onDestroy()
    }

    private fun buildShell(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(BG)
        }
        root.addView(buildTopBar(), LinearLayout.LayoutParams(-1, dp(74)))
        content = FrameLayout(this).apply { setBackgroundColor(BG) }
        root.addView(content, LinearLayout.LayoutParams(-1, 0, 1f))
        nav = buildBottomNav()
        root.addView(nav, LinearLayout.LayoutParams(-1, dp(86)).apply {
            leftMargin = dp(16)
            rightMargin = dp(16)
            bottomMargin = dp(12)
        })
        return root
    }

    private fun buildTopBar(): View {
        val bar = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(20), dp(10), dp(18), dp(8))
        }
        val title = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        title.addView(label("THÁI DUY", 18, INK, bold = true))
        title.addView(label("SYSTEMS HUB", 10, MUTED, mono = true).apply { letterSpacing = .16f })
        bar.addView(title, LinearLayout.LayoutParams(0, -2, 1f))
        val paired = SecureStore.token(this) != null
        bar.addView(label(if (paired) "● PAIRED" else "○ LOCAL", 10, if (paired) LIVE else MUTED, mono = true))
        return bar
    }

    private fun buildBottomNav(): LinearLayout {
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(8), dp(8), dp(4))
            background = rounded(CARD, 28f)
            elevation = dp(5).toFloat()
        }
        listOf(
            Triple("home", "⌂", "Home"),
            Triple("sensor", "∿", "Sensor"),
            Triple("control", "□", "Control"),
            Triple("inbox", "✉", "Inbox"),
            Triple("settings", "⚙", "Settings"),
        ).forEach { (key, iconText, title) ->
            val item = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                isClickable = true
                isFocusable = true
                setPadding(dp(2), 0, dp(2), 0)
            }
            val icon = label(iconText, 21, MUTED, bold = true).apply {
                gravity = Gravity.CENTER
                tag = "icon"
                setPadding(dp(10), dp(5), dp(10), dp(5))
            }
            val caption = label(title, 9, MUTED).apply {
                tag = "caption"
                gravity = Gravity.CENTER
            }
            item.addView(icon, LinearLayout.LayoutParams(dp(48), dp(42)))
            item.addView(caption)
            item.setOnClickListener { showTab(key) }
            navItems[key] = item
            bar.addView(item, LinearLayout.LayoutParams(0, -1, 1f))
        }
        return bar
    }

    private fun showTab(tab: String) {
        selectedTab = if (tab in navItems.keys) tab else "home"
        renderNavState()
        content.removeAllViews()
        val view = when (selectedTab) {
            "sensor" -> sensorView()
            "control" -> controlView()
            "inbox" -> inboxView()
            "settings" -> settingsView()
            else -> homeView()
        }
        content.addView(view, FrameLayout.LayoutParams(-1, -1))
    }

    private fun renderNavState() {
        navItems.forEach { (key, item) ->
            val selected = key == selectedTab
            item.translationY = if (selected) -dp(7).toFloat() else 0f
            val icon = item.findViewWithTag<TextView>("icon")
            val caption = item.findViewWithTag<TextView>("caption")
            icon.setTextColor(if (selected) INK else MUTED)
            caption.setTextColor(if (selected) INK else MUTED)
            caption.setTypeface(Typeface.DEFAULT, if (selected) Typeface.BOLD else Typeface.NORMAL)
            icon.background = if (selected) rounded(SOFT, 22f) else null
        }
    }

    private fun homeView(): View {
        val root = page()
        root.addView(kicker("HUB / LIVE SYSTEMS"))
        root.addView(heading("Everything that moves\non thaiduy.digital."))
        root.addView(body("One private Android surface for music sensing, Control, inbox and operator signals."))

        val paired = SecureStore.token(this) != null
        val sources = TrackedApps.get(this).size
        val notificationAccess = notificationAccessGranted()
        val dspRunning = SensorState.running(this)
        val lastFrame = SensorState.lastFrameAt(this)

        root.addView(metricGrid(
            listOf(
                "HUB" to if (paired) "PAIRED" else "OFFLINE",
                "SOURCE" to if (sources > 0) sources.toString() + " APP" else "NONE",
                "SCROBBLE" to if (notificationAccess) "READY" else "SETUP",
                "LIVE DSP" to if (dspRunning) "STREAMING" else "IDLE",
            ),
        ))

        val sensorText = if (dspRunning) {
            val age = if (lastFrame > 0) ((System.currentTimeMillis() - lastFrame) / 1000).coerceAtLeast(0) else -1
            "DSP stream active · " + if (age >= 0) "last frame " + age + "s ago" else "waiting for audio"
        } else {
            "Background scrobble stays available. Start Live DSP when you want the web wave to follow the actual playback signal."
        }
        root.addView(sectionCard("MUSIC SENSOR", sensorText, if (dspRunning) LIVE else ACCENT) {
            showTab("sensor")
        })
        root.addView(sectionCard("CONTROL", "Open the full owner control plane inside the Hub.", INK) {
            showTab("control")
        })

        val inboxSummary = label("Checking contact inbox…", 12, MUTED)
        root.addView(cardContainer().apply {
            addView(kicker("INBOX / ABOUT CONTACT"))
            addView(inboxSummary.apply { setPadding(0, dp(8), 0, dp(6)) })
            setOnClickListener { showTab("inbox") }
        })
        refreshInboxSummary(inboxSummary)
        return wrap(root)
    }

    private fun sensorView(): View {
        val root = page()
        root.addView(kicker("MUSIC SENSOR / RIGHT EAR"))
        root.addView(heading("Playback in.\nSignal out."))
        root.addView(body("Metadata can run quietly in the background. Live DSP uses Android playback capture and never uploads raw PCM."))

        val paired = SecureStore.token(this) != null
        val sourceCount = TrackedApps.get(this).size
        val notificationAccess = notificationAccessGranted()
        val running = SensorState.running(this)
        val error = SensorState.lastError(this)

        root.addView(cardContainer().apply {
            addView(kicker("PAIR HUB DEVICE"))
            pairCode = EditText(this@MainActivity).apply {
                inputType = InputType.TYPE_CLASS_NUMBER
                filters = arrayOf(InputFilter.LengthFilter(6))
                hint = "000000"
                gravity = Gravity.CENTER
                textSize = 22f
                typeface = Typeface.MONOSPACE
                setTextColor(INK)
                setHintTextColor(0xFFB3BBB6.toInt())
                background = rounded(0xFFF0F2EE.toInt(), 16f)
                setPadding(dp(12), dp(10), dp(12), dp(10))
            }
            addView(pairCode, LinearLayout.LayoutParams(-1, dp(58)).apply { topMargin = dp(12) })
            pairButton = actionButton(if (paired) "PAIR AGAIN / REFRESH HUB TOKEN" else "PAIR DEVICE") { pairDevice() }
            addView(pairButton, LinearLayout.LayoutParams(-1, dp(50)).apply { topMargin = dp(8) })
        })

        root.addView(cardContainer().apply {
            addView(kicker("SOURCE APP"))
            addView(label(
                if (sourceCount > 0) sourceCount.toString() + " app(s) selected" else "No playback source selected",
                17,
                INK,
                bold = true,
            ).apply { setPadding(0, dp(8), 0, dp(4)) })
            addView(body("DSP capture is filtered to the UID of the apps you choose. Protected/DRM playback may remain uncapturable by Android."))
            addView(actionButton("CHOOSE MUSIC SOURCE") {
                startActivity(Intent(this@MainActivity, AppSelectionActivity::class.java))
            }, LinearLayout.LayoutParams(-1, dp(50)).apply { topMargin = dp(10) })
        })

        root.addView(cardContainer().apply {
            addView(kicker("BACKGROUND SCROBBLE"))
            addView(statusLine(
                if (notificationAccess) "READY" else "NOTIFICATION ACCESS REQUIRED",
                notificationAccess,
            ))
            addView(actionButton("MANAGE NOTIFICATION ACCESS") {
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }, LinearLayout.LayoutParams(-1, dp(48)).apply { topMargin = dp(10) })
        })

        root.addView(cardContainer().apply {
            addView(kicker("LIVE DSP / WEB WAVE"))
            addView(statusLine(if (running) "STREAMING" else "IDLE", running))
            if (running) {
                addView(levelRow("RMS", SensorState.lastRms(this@MainActivity)))
                addView(levelRow("PEAK", SensorState.lastPeak(this@MainActivity)))
            }
            if (!error.isNullOrBlank()) {
                addView(label(error, 11, 0xFFAA6658.toInt()).apply { setPadding(0, dp(8), 0, 0) })
            }
            addView(actionButton(if (running) "RESTART LIVE DSP" else "START LIVE DSP") {
                beginLiveDsp()
            }, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(12) })
            addView(secondaryButton("STOP DSP") { stopLiveDsp() }, LinearLayout.LayoutParams(-1, dp(46)).apply { topMargin = dp(7) })
            addView(label(
                "Android must show one system playback-capture consent per new DSP session. After approval, the foreground service keeps running when this screen closes.",
                10,
                MUTED,
            ).apply { setPadding(0, dp(10), 0, 0) })
        })
        return wrap(root)
    }

    private fun controlView(): View {
        val shell = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(BG)
        }
        val strip = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(6), dp(12), dp(6))
        }
        strip.addView(label("CONTROL / OWNER WEB SESSION", 9, MUTED, mono = true), LinearLayout.LayoutParams(0, -2, 1f))
        strip.addView(secondaryButton("BROWSER ↗") {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://thaiduy.digital/control")))
        }, LinearLayout.LayoutParams(dp(104), dp(38)))
        shell.addView(strip, LinearLayout.LayoutParams(-1, dp(50)))

        val web = webView ?: WebView(this).also { view ->
            CookieManager.getInstance().setAcceptCookie(true)
            view.settings.javaScriptEnabled = true
            view.settings.domStorageEnabled = true
            view.settings.allowFileAccess = false
            view.settings.allowContentAccess = false
            view.settings.userAgentString = view.settings.userAgentString + " ThaiDuyHub/0.4"
            view.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(v: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    val host = uri.host?.lowercase() ?: return false
                    if (host == "thaiduy.digital" || host.endsWith(".thaiduy.digital")) return false
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                    return true
                }
            }
            view.setBackgroundColor(BG)
            view.loadUrl("https://thaiduy.digital/control")
            webView = view
        }
        if (web.parent != null) (web.parent as ViewGroup).removeView(web)
        shell.addView(web, LinearLayout.LayoutParams(-1, 0, 1f))
        return shell
    }

    private fun inboxView(): View {
        val root = page()
        root.addView(kicker("INBOX / ABOUT CONTACT"))
        root.addView(heading("Messages from\nthe public surface."))
        root.addView(body("Read-only Hub access. Website mutation still requires the owner Control session."))

        val token = SecureStore.token(this)
        if (token == null) {
            root.addView(sectionCard("PAIRING REQUIRED", "Pair this Hub again to receive the read-only inbox scope.", ACCENT) {
                showTab("sensor")
            })
            return wrap(root)
        }

        val loading = label("Loading inbox…", 12, MUTED).apply { setPadding(0, dp(18), 0, 0) }
        root.addView(loading)
        Thread {
            val result = runCatching { ApiClient.fetchInbox(token, limit = 30) }
            runOnUiThread {
                root.removeView(loading)
                result.onSuccess { inbox ->
                    root.addView(label(inbox.newCount.toString() + " NEW", 11, if (inbox.newCount > 0) LIVE else MUTED, mono = true).apply {
                        setPadding(0, dp(12), 0, dp(4))
                    })
                    if (inbox.messages.isEmpty()) {
                        root.addView(sectionCard("INBOX CLEAR", "No contact messages yet.", MUTED, null))
                    } else {
                        inbox.messages.forEach { message -> root.addView(contactCard(message)) }
                    }
                }.onFailure {
                    root.addView(sectionCard(
                        "INBOX UNAVAILABLE",
                        "This paired token may predate Hub Inbox scope. Re-pair once from /control/music-sensor.",
                        ACCENT,
                    ) { showTab("sensor") })
                }
            }
        }.start()
        return wrap(root)
    }

    private fun settingsView(): View {
        val root = page()
        root.addView(kicker("HUB / SETTINGS"))
        root.addView(heading("Small surface.\nBounded access."))
        val id = SecureStore.deviceId(this)
        root.addView(sectionCard(
            "DEVICE",
            if (id != null) "Paired · " + id.take(8) + "…" else "Not paired",
            if (id != null) LIVE else MUTED,
            null,
        ))
        root.addView(sectionCard(
            "BACKGROUND INBOX",
            "Android JobScheduler checks for new About messages every ~15 minutes. Open Inbox refreshes immediately.",
            INK,
            null,
        ))
        root.addView(sectionCard(
            "CONTROL AUTH",
            "The native device token is read-only outside Music Sensor. Full mutations stay behind the website owner session.",
            INK,
            null,
        ))
        root.addView(actionButton("OPEN CONTROL IN SYSTEM BROWSER") {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://thaiduy.digital/control")))
        }, LinearLayout.LayoutParams(-1, dp(52)).apply { topMargin = dp(8) })
        root.addView(secondaryButton("SELECT TRACKED APPS") {
            startActivity(Intent(this, AppSelectionActivity::class.java))
        }, LinearLayout.LayoutParams(-1, dp(48)).apply { topMargin = dp(8) })
        return wrap(root)
    }

    private fun refreshInboxSummary(target: TextView) {
        val token = SecureStore.token(this)
        if (token == null) {
            target.text = "Pair Hub to connect the private inbox."
            return
        }
        Thread {
            val result = runCatching { ApiClient.fetchInbox(token, limit = 1) }
            runOnUiThread {
                target.text = result.fold(
                    onSuccess = { it.newCount.toString() + " new · tap to read messages" },
                    onFailure = { "Inbox scope unavailable · re-pair Hub once" },
                )
            }
        }.start()
    }

    private fun pairDevice() {
        val input = pairCode ?: return
        val code = input.text.toString().trim()
        if (code.length != 6) {
            input.error = "Enter the 6-digit code from Control / Music Sensor"
            return
        }
        pairButton?.isEnabled = false
        pairButton?.text = "PAIRING…"
        Thread {
            val result = runCatching {
                ApiClient.pair(code, (Build.MANUFACTURER + " " + Build.MODEL).trim())
            }
            runOnUiThread {
                pairButton?.isEnabled = true
                result.onSuccess {
                    SecureStore.save(this, it.token, it.deviceId)
                    input.text.clear()
                    InboxScheduler.schedule(this)
                    requestNotificationPermissionIfNeeded()
                    showTab("sensor")
                }.onFailure {
                    input.error = "Pairing failed. Rotate the code and try again."
                    pairButton?.text = "PAIR DEVICE"
                }
            }
        }.start()
    }

    private fun beginLiveDsp() {
        if (SecureStore.token(this) == null) {
            showTab("sensor")
            return
        }
        if (TrackedApps.get(this).isEmpty()) {
            startActivity(Intent(this, AppSelectionActivity::class.java))
            return
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingStart = true
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_AUDIO)
            return
        }
        requestProjection()
    }

    private fun requestProjection() {
        val manager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        @Suppress("DEPRECATION")
        startActivityForResult(manager.createScreenCaptureIntent(), REQUEST_PROJECTION)
    }

    @Deprecated("Legacy result callback is used to keep minSdk 29 without AndroidX.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQUEST_PROJECTION) return
        if (resultCode != RESULT_OK || data == null) {
            SensorState.error(this, "Playback capture was not granted.")
            showTab("sensor")
            return
        }
        val service = Intent(this, CaptureService::class.java)
            .setAction(CaptureService.ACTION_START)
            .putExtra(CaptureService.EXTRA_RESULT_CODE, resultCode)
            .putExtra(CaptureService.EXTRA_PROJECTION_DATA, data)
        startForegroundService(service)
        showTab("sensor")
    }

    private fun stopLiveDsp() {
        startService(Intent(this, CaptureService::class.java).setAction(CaptureService.ACTION_STOP))
        SensorState.setRunning(this, false)
        showTab("sensor")
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_AUDIO && pendingStart) {
            pendingStart = false
            if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) requestProjection()
            else {
                SensorState.error(this, "Android RECORD_AUDIO permission is required for playback capture.")
                showTab("sensor")
            }
        }
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
        }
    }

    private fun notificationAccessGranted(): Boolean {
        val manager = getSystemService(NotificationManager::class.java)
        return manager.isNotificationListenerAccessGranted(
            ComponentName(this, ScrobbleService::class.java),
        )
    }

    private fun registerDspReceiver() {
        val filter = IntentFilter(CaptureService.ACTION_STATE)
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(dspStateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(dspStateReceiver, filter)
        }
    }

    private fun contactCard(message: ContactMessage): View =
        cardContainer().apply {
            addView(label(message.name, 17, INK, bold = true))
            val contact = message.email + (message.phone?.let { " · " + it } ?: "")
            addView(label(contact, 10, MUTED, mono = true).apply {
                setPadding(0, dp(3), 0, dp(9))
            })
            addView(label(message.message, 13, INK))
            addView(label(message.createdAt.replace("T", " ").take(19), 9, MUTED, mono = true).apply {
                setPadding(0, dp(10), 0, 0)
            })
        }

    private fun metricGrid(values: List<Pair<String, String>>): View {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(20), 0, dp(4))
        }
        values.chunked(2).forEach { rowValues ->
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            rowValues.forEachIndexed { index, (name, value) ->
                val card = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    background = rounded(CARD, 22f)
                    elevation = dp(1).toFloat()
                    setPadding(dp(14), dp(13), dp(14), dp(13))
                    addView(kicker(name))
                    addView(label(value, 17, INK, bold = true).apply { setPadding(0, dp(5), 0, 0) })
                }
                row.addView(card, LinearLayout.LayoutParams(0, dp(82), 1f).apply {
                    rightMargin = if (index == 0) dp(6) else 0
                    leftMargin = if (index == 0) 0 else dp(6)
                    bottomMargin = dp(12)
                })
            }
            wrap.addView(row, LinearLayout.LayoutParams(-1, -2))
        }
        return wrap
    }

    private fun sectionCard(title: String, text: String, accent: Int, action: (() -> Unit)?): View =
        cardContainer().apply {
            val top = LinearLayout(this@MainActivity).apply {
                gravity = Gravity.CENTER_VERTICAL
                addView(kicker(title), LinearLayout.LayoutParams(0, -2, 1f))
                addView(label("●", 12, accent))
            }
            addView(top)
            addView(label(text, 13, INK).apply { setPadding(0, dp(9), 0, 0) })
            if (action != null) {
                isClickable = true
                isFocusable = true
                setOnClickListener { action() }
            }
        }

    private fun statusLine(text: String, good: Boolean): View =
        label((if (good) "● " else "○ ") + text, 12, if (good) LIVE else MUTED, mono = true).apply {
            setPadding(0, dp(8), 0, 0)
        }

    private fun levelRow(name: String, value: Float): View {
        val row = LinearLayout(this).apply {
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp(8), 0, 0)
        }
        row.addView(label(name, 9, MUTED, mono = true), LinearLayout.LayoutParams(dp(46), -2))
        val bar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 1000
            progress = (value.coerceIn(0f, 1f) * 1000).toInt()
        }
        row.addView(bar, LinearLayout.LayoutParams(0, dp(8), 1f))
        return row
    }

    private fun page(): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(14), dp(20), dp(30))
        }

    private fun wrap(child: View): ScrollView =
        ScrollView(this).apply {
            setBackgroundColor(BG)
            isFillViewport = true
            addView(child, ViewGroup.LayoutParams(-1, -2))
        }

    private fun cardContainer(): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(CARD, 22f)
            elevation = dp(2).toFloat()
            setPadding(dp(16), dp(15), dp(16), dp(15))
            layoutParams = LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) }
        }

    private fun actionButton(text: String, action: () -> Unit): Button =
        Button(this).apply {
            this.text = text
            textSize = 11f
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            isAllCaps = false
            setTextColor(Color.WHITE)
            background = rounded(INK, 16f)
            setOnClickListener { action() }
        }

    private fun secondaryButton(text: String, action: () -> Unit): Button =
        Button(this).apply {
            this.text = text
            textSize = 10f
            typeface = Typeface.create(Typeface.MONOSPACE, Typeface.BOLD)
            isAllCaps = false
            setTextColor(INK)
            background = rounded(SOFT, 15f)
            setOnClickListener { action() }
        }

    private fun kicker(text: String): TextView =
        label(text, 9, MUTED, mono = true, bold = true).apply { letterSpacing = .12f }

    private fun heading(text: String): TextView =
        label(text, 30, INK, bold = true).apply {
            setLineSpacing(0f, .96f)
            setPadding(0, dp(9), 0, dp(10))
        }

    private fun body(text: String): TextView =
        label(text, 13, MUTED).apply { setLineSpacing(0f, 1.18f) }

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
