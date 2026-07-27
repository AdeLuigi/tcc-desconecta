import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../firebase'
import LoginPage from './LoginPage'
import CmaPage from './CmaPage'

const ALLOWED_EMAILS = ['adeluigi@ic.ufrj.br', 'ademario63@gmail.com']

export default function CmaRoot() {
  const [user, setUser] = useState(undefined) // undefined = ainda carregando

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.includes(u.email)) {
        setUser(u)
      } else {
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  if (user === undefined) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner} />
      </div>
    )
  }

  if (!user) return <LoginPage />
  return <CmaPage user={user} />
}

const loadingStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
