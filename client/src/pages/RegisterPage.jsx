import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.username || !form.email || !form.password) { setError('Заповніть всі поля'); return }
    if (form.password !== form.confirm) { setError('Паролі не збігаються'); return }
    if (form.password.length < 6) { setError('Пароль має бути щонайменше 6 символів'); return }
    if (!/^[a-z0-9_]+$/i.test(form.username)) { setError('Username: тільки латинські літери, цифри та _'); return }

    setLoading(true)
    const result = await register(form.name, form.username, form.email, form.password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-earth-100 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <Compass size={32} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-stone-800">Мандри</h1>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
          <h2 className="font-display text-2xl font-bold text-stone-800 mb-6">Створити акаунт</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: "Ім'я", placeholder: "Ваше ім'я", type: 'text' },
              { key: 'username', label: 'Username', placeholder: 'my_username', type: 'text', hint: 'Для пошуку іншими користувачами' },
              { key: 'email', label: 'Email', placeholder: 'your@email.com', type: 'email' },
              { key: 'password', label: 'Пароль', placeholder: '••••••••', type: 'password' },
              { key: 'confirm', label: 'Повторіть пароль', placeholder: '••••••••', type: 'password' },
            ].map(({ key, label, placeholder, type, hint }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  className="input-field"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
                {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
              </div>
            ))}
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center flex items-center gap-2 py-3 text-base"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : 'Зареєструватися'
              }
            </button>
          </form>
          <p className="text-center text-stone-500 text-sm mt-6">
            Вже є акаунт? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
