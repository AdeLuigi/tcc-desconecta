import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../../firebase'

const CATEGORIAS = [
  'Redes sociais',
  'Entretenimento',
  'Jogos',
  'Produtividade',
  'Comunicação',
  'Geral',
]

const emptyForm = {
  nome: '',
  descricao: '',
  categoria: '',
  duracao: '',
  meta: '',
}

export default function CmaPage({ user }) {
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    if (!form.nome || !form.descricao || !form.categoria || !form.duracao || !form.meta) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.')
      return
    }
    if (!imageFile) {
      setErrorMsg('Por favor, selecione uma imagem para o desafio.')
      return
    }

    setSaving(true)
    try {
      // Upload da imagem
      setUploadingImage(true)
      const filename = `desafios/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const storageRef = ref(storage, filename)
      await uploadBytes(storageRef, imageFile)
      const imageURL = await getDownloadURL(storageRef)
      setUploadingImage(false)

      // Criar documento no Firestore
      const now = Timestamp.now()
      const duracao = parseInt(form.duracao)
      const dataFinal = Timestamp.fromDate(
        new Date(now.toDate().getTime() + duracao * 24 * 60 * 60 * 1000)
      )

      await addDoc(collection(db, 'desafios'), {
        nome: form.nome,
        descricao: form.descricao,
        categoria: form.categoria,
        duracao: duracao,
        meta: parseInt(form.meta),
        imagem: imageURL,
        dataInicio: now,
        dataFinal: dataFinal,
      })

      setSuccessMsg(`Desafio "${form.nome}" criado com sucesso!`)
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      console.error('Erro ao criar desafio:', err)
      setErrorMsg('Erro ao criar desafio. Verifique o console e tente novamente.')
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  const handleLogout = () => signOut(auth)

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.headerTitle}>CMA — Desconecta</h1>
            <p style={styles.headerSub}>Cadastro de desafios</p>
          </div>
          <div style={styles.userInfo}>
            {user.photoURL && (
              <img src={user.photoURL} alt="avatar" style={styles.avatar} />
            )}
            <span style={styles.userName}>{user.displayName || user.email}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Novo desafio</h2>

          {successMsg && <div style={styles.success}>{successMsg}</div>}
          {errorMsg && <div style={styles.error}>{errorMsg}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Nome */}
            <div style={styles.field}>
              <label style={styles.label}>Nome *</label>
              <input
                style={styles.input}
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex: Semana sem redes sociais"
                maxLength={80}
              />
            </div>

            {/* Descrição */}
            <div style={styles.field}>
              <label style={styles.label}>Descrição *</label>
              <textarea
                style={{ ...styles.input, height: 100, resize: 'vertical' }}
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Descreva o objetivo e as regras do desafio"
                maxLength={500}
              />
            </div>

            {/* Categoria */}
            <div style={styles.field}>
              <label style={styles.label}>Categoria *</label>
              <select
                style={styles.input}
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Duração e Meta */}
            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Duração (dias) *</label>
                <input
                  style={styles.input}
                  type="number"
                  name="duracao"
                  value={form.duracao}
                  onChange={handleChange}
                  placeholder="Ex: 7"
                  min="1"
                  max="365"
                />
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>Meta (min/dia) *</label>
                <input
                  style={styles.input}
                  type="number"
                  name="meta"
                  value={form.meta}
                  onChange={handleChange}
                  placeholder="Ex: 30"
                  min="1"
                />
              </div>
            </div>

            {/* Imagem */}
            <div style={styles.field}>
              <label style={styles.label}>Imagem (badge) *</label>
              <div style={styles.imageArea}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={styles.imagePreview} />
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <span style={{ fontSize: 32 }}>🖼️</span>
                    <span style={{ color: '#94A3B8', fontSize: 14 }}>Nenhuma imagem selecionada</span>
                  </div>
                )}
                <label style={styles.imageBtn}>
                  {imagePreview ? 'Trocar imagem' : 'Selecionar imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
            >
              {uploadingImage
                ? 'Enviando imagem...'
                : saving
                ? 'Salvando...'
                : 'Criar desafio'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F1F5F9',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    padding: '0 24px',
  },
  headerInner: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '20px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  headerSub: {
    color: '#C7D2FE',
    fontSize: 13,
    margin: '2px 0 0',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid #C7D2FE',
  },
  userName: {
    color: '#E0E7FF',
    fontSize: 14,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  main: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    background: '#ffffff',
    borderRadius: 20,
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1E1B4B',
    margin: '0 0 24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 15,
    color: '#1E293B',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    background: '#FAFAFA',
    width: '100%',
    boxSizing: 'border-box',
  },
  imageArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    border: '2px dashed #CBD5E1',
    borderRadius: 12,
    background: '#F8FAFC',
  },
  imagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    objectFit: 'cover',
    border: '2px solid #E2E8F0',
  },
  imageBtn: {
    background: '#312E81',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #312E81 0%, #4338CA 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
  },
  success: {
    background: '#F0FDF4',
    color: '#166534',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    marginBottom: 16,
  },
  error: {
    background: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    marginBottom: 16,
  },
}
