import { useState } from 'react'

interface PlayerSetupProps {
  onSetup: (serverUrl: string, token: string, playerName: string) => void
}

export function PlayerSetup({ onSetup }: PlayerSetupProps) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3003')
  const [pairingCode, setPairingCode] = useState('')
  const [isPairing, setIsPairing] = useState(false)
  const [error, setError] = useState('')

  const handlePair = async () => {
    if (!serverUrl || !pairingCode) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setIsPairing(true)
    setError('')

    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/players/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pairingCode }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Code invalide')
      }

      const data = await response.json()
      onSetup(serverUrl, data.token, data.name)
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsPairing(false)
    }
  }

  // Prevent right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        padding: '40px',
        cursor: 'default',
      }}
      onContextMenu={handleContextMenu}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          padding: '48px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontWeight: 700 }}>
            📺 Slide Effect Player
          </h1>
          <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>
            Configuration du lecteur d'affichage dynamique
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.8 }}>
              URL du serveur
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://votre-serveur.com"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.8 }}>
              Code de jumelage
            </label>
            <input
              type="text"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1.5rem',
                letterSpacing: '8px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handlePair}
            disabled={isPairing}
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '1.1rem',
              fontWeight: 600,
              background: isPairing ? 'rgba(99,102,241,0.5)' : '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: isPairing ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              transition: 'all 0.2s',
            }}
          >
            {isPairing ? 'Connexion...' : 'Connecter le player'}
          </button>
        </div>

        <div
          style={{
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            opacity: 0.6,
            lineHeight: 1.6,
          }}
        >
          <strong>Comment obtenir un code ?</strong>
          <br />
          1. Connectez-vous au dashboard admin
          <br />
          2. Allez dans "Players" → "Ajouter un player"
          <br />
          3. Un code de 6 chiffres sera généré
        </div>
      </div>
    </div>
  )
}
