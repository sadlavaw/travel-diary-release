import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Заповніть всі поля'); return }
    setLoading(true)
    const result = await login(form.email, form.password)
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
          <p className="text-stone-500 mt-1">Ваш щоденник подорожей Україною</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 animate-slide-up">
          <h2 className="font-display text-2xl font-bold text-stone-800 mb-6">Вхід до акаунту</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center justify-center flex items-center gap-2 py-3 text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : 'Увійти'}
            </button>
          </form>

          <p className="text-center text-stone-500 text-sm mt-6">
            Немає акаунту?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Зареєструватися
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
