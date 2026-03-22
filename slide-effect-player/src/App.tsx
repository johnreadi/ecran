import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { PlayerSetup } from './components/PlayerSetup'
import { SlidePlayer } from './components/SlidePlayer'
import { OfflinePlayer } from './components/OfflinePlayer'

interface PlayerConfig {
  serverUrl: string
  token: string
  playerName: string
}

interface Playlist {
  id: string
  name: string
  slides: any[]
  settings?: any
}

function App() {
  const [config, setConfig] = useState<PlayerConfig | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [playerId, setPlayerId] = useState<string>('')

  // Load config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('slide-effect-player-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig(parsed)
      } catch {
        localStorage.removeItem('slide-effect-player-config')
      }
    }
  }, [])

  // Save config when it changes
  useEffect(() => {
    if (config) {
      localStorage.setItem('slide-effect-player-config', JSON.stringify(config))
    }
  }, [config])

  // Connect to server
  useEffect(() => {
    if (!config) return

    const socketUrl = config.serverUrl.replace(/\/$/, '')
    const newSocket = io(socketUrl, {
      auth: {
        token: config.token,
        type: 'player',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 5000,
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to server')
      setIsConnected(true)
      setIsOffline(false)

      // Fetch initial playlist
      fetch(`${socketUrl}/api/players/me/playlist`, {
        headers: { 'X-Player-Token': config.token },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.playlist) {
            setPlaylist(data.playlist)
            setPlayerId(data.player?.id || '')
          }
        })
        .catch(console.error)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
      setIsOffline(true)
    })

    newSocket.on('player:update', (data: { playlist: Playlist }) => {
      console.log('📦 Received playlist update')
      setPlaylist(data.playlist)
      setCurrentSlideIndex(0)
    })

    newSocket.on('player:command', (data: { command: string }) => {
      console.log('🎮 Received command:', data.command)
      switch (data.command) {
        case 'refresh':
          window.location.reload()
          break
        case 'restart':
          setCurrentSlideIndex(0)
          break
        case 'next':
          setCurrentSlideIndex((prev) => prev + 1)
          break
        case 'prev':
          setCurrentSlideIndex((prev) => Math.max(0, prev - 1))
          break
      }
    })

    setSocket(newSocket)

    // Ping every 10 seconds
    const pingInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('player:ping')
      }
    }, 10000)

    // Report slide status every 5 seconds
    const statusInterval = setInterval(() => {
      if (newSocket.connected && playlist) {
        newSocket.emit('player:status', {
          slideIndex: currentSlideIndex,
          playlistId: playlist.id,
        })
      }
    }, 5000)

    return () => {
      clearInterval(pingInterval)
      clearInterval(statusInterval)
      newSocket.close()
    }
  }, [config, currentSlideIndex, playlist])

  // Handle slide change
  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlideIndex(index)
    if (socket?.connected && playlist) {
      socket.emit('player:status', {
        slideIndex: index,
        playlistId: playlist.id,
      })
    }
  }, [socket, playlist])

  // Handle setup completion
  const handleSetup = (serverUrl: string, token: string, playerName: string) => {
    setConfig({ serverUrl, token, playerName })
  }

  // Reset config
  const handleReset = () => {
    localStorage.removeItem('slide-effect-player-config')
    setConfig(null)
    setPlaylist(null)
    socket?.close()
    setSocket(null)
  }

  // Show setup screen if no config
  if (!config) {
    return <PlayerSetup onSetup={handleSetup} />
  }

  // Show offline player if disconnected and has cached playlist
  if (isOffline && playlist) {
    return (
      <OfflinePlayer
        playlist={playlist}
        currentSlideIndex={currentSlideIndex}
        onSlideChange={handleSlideChange}
        onReset={handleReset}
      />
    )
  }

  // Show main player
  return (
    <SlidePlayer
      playlist={playlist}
      currentSlideIndex={currentSlideIndex}
      onSlideChange={handleSlideChange}
      isConnected={isConnected}
      playerName={config.playerName}
      onReset={handleReset}
    />
  )
}

export default App
