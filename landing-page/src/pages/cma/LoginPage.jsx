import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../firebase'

const ALLOWED_EMAILS = ['adeluigi@ic.ufrj.br', 'ademario63@gmail.com']

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      if (!ALLOWED_EMAILS.includes(result.user.email)) {
        await auth.signOut()
        setError('Acesso não autorizado para este email.')
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao fazer login. Tente novamente.')
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🔒</div>
        <h1 style={styles.title}>CMA — Desconecta</h1>
        <p style={styles.subtitle}>Área restrita de gerenciamento de conteúdo</p>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1E1B4B',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    margin: '0 0 32px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 24px',
    border: '2px solid #E2E8F0',
    borderRadius: 12,
    background: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    padding: '10px 16px',
    background: '#FEF2F2',
    borderRadius: 8,
  },
}
