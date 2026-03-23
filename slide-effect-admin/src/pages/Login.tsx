import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Tv2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@signage.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState({
    logo_url: '',
    primary_color: '#f97316',
    platform_name: 'Slide Effect',
    tagline: 'Digital Signage Platform'
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadBranding()
  }, [])

  const loadBranding = async () => {
    try {
      const response = await api.get('/admin/settings')
      setBranding({
        logo_url: response.data.branding_logo_url || '',
        primary_color: response.data.branding_primary_color || '#f97316',
        platform_name: response.data.platform_name || 'Slide Effect',
        tagline: response.data.platform_tagline || 'Digital Signage Platform'
      })
    } catch (error) {
      console.error('Error loading branding:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      // Redirect based on role
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Email ou mot de passe incorrect'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          {branding.logo_url ? (
            <img 
              src={branding.logo_url} 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: branding.primary_color }}
            >
              <Tv2 size={22} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">{branding.platform_name}</h1>
            <p className="text-xs text-gray-400">{branding.tagline}</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6">Connexion</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: branding.primary_color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = branding.primary_color
              e.currentTarget.style.filter = 'brightness(0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
