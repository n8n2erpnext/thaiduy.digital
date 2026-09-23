package digital.thaiduy.hub

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object SecureStore {
    private const val ALIAS = "thaiduy_hub_key"
    private const val PREFS = "thaiduy_hub"
    private const val TOKEN = "token"
    private const val DEVICE_ID = "device_id"
    private const val OWNER_EMAIL = "owner_email"

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val existing = store.getKey(ALIAS, null) as? SecretKey
        if (existing != null) return existing

        val generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore",
        )
        generator.init(
            KeyGenParameterSpec.Builder(
                ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build(),
        )
        return generator.generateKey()
    }

    private fun encrypted(token: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        return Base64.encodeToString(
            cipher.iv + cipher.doFinal(token.toByteArray()),
            Base64.NO_WRAP,
        )
    }

    private fun resetKey() {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (store.containsAlias(ALIAS)) store.deleteEntry(ALIAS)
    }

    private fun persist(
        context: Context,
        token: String,
        deviceId: String,
        ownerEmail: String?,
    ) {
        val encoded = encrypted(token)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(TOKEN, encoded)
            .putString(DEVICE_ID, deviceId)
            .also { editor ->
                if (!ownerEmail.isNullOrBlank()) {
                    editor.putString(OWNER_EMAIL, ownerEmail.trim())
                }
            }
            .apply()
    }

    fun save(
        context: Context,
        token: String,
        deviceId: String,
        ownerEmail: String? = null,
    ): Boolean {
        HubDiagnostics.mark(context, "secure_store.save")
        val first = runCatching {
            persist(context, token, deviceId, ownerEmail)
        }
        if (first.isSuccess) {
            HubDiagnostics.mark(context, "secure_store.saved")
            return true
        }

        val recovery = runCatching {
            resetKey()
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(TOKEN)
                .apply()
            persist(context, token, deviceId, ownerEmail)
        }
        if (recovery.isSuccess) {
            HubDiagnostics.mark(context, "secure_store.recovered")
            return true
        }

        HubDiagnostics.error(
            context,
            "secure_store.failed",
            recovery.exceptionOrNull() ?: first.exceptionOrNull(),
        )
        return false
    }

    fun token(context: Context): String? {
        val encoded = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(TOKEN, null)
            ?: return null

        return runCatching {
            val data = Base64.decode(encoded, Base64.NO_WRAP)
            require(data.size > 12)
            val iv = data.copyOfRange(0, 12)
            val encrypted = data.copyOfRange(12, data.size)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
            String(cipher.doFinal(encrypted))
        }.onFailure {
            HubDiagnostics.error(context, "secure_store.read", it)
        }.getOrNull()
    }

    fun deviceId(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(DEVICE_ID, null)

    fun ownerEmail(context: Context): String? =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(OWNER_EMAIL, null)

    fun saveOwnerEmail(context: Context, email: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(OWNER_EMAIL, email.trim())
            .apply()
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
    }
}
