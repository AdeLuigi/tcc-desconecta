package com.tccdesconecta.screentime

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Activity de bloqueio que é lançada por cima do app bloqueado.
 * Exibe uma tela informando que o tempo limite foi atingido.
 */
class BlockActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedApp = intent.getStringExtra("blocked_app") ?: ""
        val limitMinutes = intent.getIntExtra("limit_minutes", 0)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(0xFF1E1B4B.toInt()) // deep indigo
            setPadding(dp(32), dp(64), dp(32), dp(64))
        }

        // Ícone emoji
        val iconView = TextView(this).apply {
            text = "⏰"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 64f)
            gravity = Gravity.CENTER
        }
        root.addView(iconView)

        // Título
        val titleView = TextView(this).apply {
            text = "Tempo Esgotado!"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
            setPadding(0, dp(24), 0, dp(12))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
        }
        root.addView(titleView)

        // Mensagem
        val messageView = TextView(this).apply {
            text = "Você atingiu o limite de $limitMinutes minutos de uso de tela.\n\nÉ hora de desconectar! 🌿"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTextColor(0xCCFFFFFF.toInt())
            gravity = Gravity.CENTER
            setPadding(dp(16), 0, dp(16), dp(32))
            setLineSpacing(dp(4).toFloat(), 1f)
        }
        root.addView(messageView)

        // Botão voltar para Home
        val homeButton = TextView(this).apply {
            text = "Voltar para a tela inicial"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            setTextColor(0xFF1E1B4B.toInt())
            gravity = Gravity.CENTER
            setBackgroundColor(0xFFFFFFFF.toInt())
            setPadding(dp(24), dp(14), dp(24), dp(14))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setOnClickListener { goHome() }
        }

        // Container com margem para o botão
        val buttonContainer = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            setPadding(0, dp(16), 0, 0)
        }
        buttonContainer.addView(homeButton)
        root.addView(buttonContainer)

        setContentView(root)
    }

    override fun onBackPressed() {
        goHome()
    }

    private fun goHome() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }
}
