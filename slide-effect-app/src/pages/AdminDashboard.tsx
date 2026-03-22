import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Users, Play, RefreshCw, Plus, Trash2, Power, Radio, Tv } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  status: 'online' | 'offline';
  last_seen: string;
  group_name?: string;
  playlist_name?: string;
  current_slide_index?: number;
  pairing_code?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  player_count: number;
}

const SERVER_URL = 'http://localhost:3003';

export function AdminDashboard() {
  const [token, setToken] = useState(localStorage.getItem('signage-token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('signage-token'));
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'playlists' | 'groups'>('players');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  // Login
  const handleLogin = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('signage-token', data.token);
      setToken(data.token);
      setIsLoggedIn(true);
    } catch (err) {
      alert('Login failed: ' + (err as Error).message);
    }
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [playersRes, playlistsRes, groupsRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/players`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${SERVER_URL}/api/playlists`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${SERVER_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (playersRes.ok) setPlayers(await playersRes.json());
      if (playlistsRes.ok) setPlaylists(await playlistsRes.json());
      if (groupsRes.ok) setGroups(await groupsRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, [token]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchData]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!token || !isLoggedIn) return;
    
    const newSocket = io(SERVER_URL, {
      auth: { token, type: 'admin' },
    });

    newSocket.on('dashboard:player-status', (data: { playerId: string; status: string }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.playerId ? { ...p, status: data.status as any } : p))
      );
    });

    newSocket.on('dashboard:player-slide', (data: { playerId: string; slideIndex: number }) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === data.playerId ? { ...p, current_slide_index: data.slideIndex } : p))
      );
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [token, isLoggedIn]);

  // Create player
  const createPlayer = async () => {
    if (!newPlayerName) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/players/generate-pairing`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newPlayerName }),
      });
      if (res.ok) {
        const data = await res.json();
        setPairingCode(data.code);
        setNewPlayerName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send command to player
  const sendCommand = async (playerId: string, command: string) => {
    try {
      await fetch(`${SERVER_URL}/api/players/${playerId}/command`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border-subtle)]">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Dashboard</h1>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
            />
            <button onClick={handleLogin} className="btn btn-primary w-full">
              Se connecter
            </button>
            <p className="text-xs text-[var(--text-tertiary)] text-center">
              Default: admin@signage.local / admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  const onlineCount = players.filter((p) => p.status === 'online').length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-500)] flex items-center justify-center">
              <Tv className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Slide Effect Admin</h1>
              <p className="text-xs text-[var(--text-tertiary)]">
                {onlineCount}/{players.length} players en ligne
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('signage-token');
              setIsLoggedIn(false);
            }}
            className="btn btn-ghost text-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] px-6">
        {(['players', 'playlists', 'groups'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-[var(--primary-400)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab === 'players' ? 'Players' : tab === 'playlists' ? 'Playlists' : 'Groupes'}
            {activeTab === tab && (
              <motion.div
                layoutId="adminTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-500)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'players' && (
          <div className="space-y-6">
            {/* Add Player */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold mb-3">Ajouter un player</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom du player"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="input flex-1"
                />
                <button onClick={createPlayer} className="btn btn-primary">
                  <Plus size={16} />
                  Générer code
                </button>
              </div>
              {pairingCode && (
                <div className="mt-4 p-4 bg-[var(--primary-500)]/10 rounded-lg border border-[var(--primary-500)]/30">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Code de jumelage :</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-[var(--primary-400)]">
                    {pairingCode}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Valide 10 minutes. Entrez ce code sur le player.
                  </p>
                </div>
              )}
            </div>

            {/* Players List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-subtle)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          player.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <button
                      onClick={() => sendCommand(player.id, 'restart')}
                      className="btn btn-ghost btn-icon"
                      title="Redémarrer"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                    <p>Groupe: {player.group_name || 'Aucun'}</p>
                    <p>Playlist: {player.playlist_name || 'Aucune'}</p>
                    {player.current_slide_index !== undefined && (
                      <p>Slide: {player.current_slide_index + 1}</p>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Dernière connexion: {player.last_seen ? new Date(player.last_seen).toLocaleString() : 'Jamais'}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => sendCommand(player.id, 'next')}
                      className="btn btn-secondary flex-1 text-xs"
                    >
                      <Play size={12} />
                      Next
                    </button>
                    <button
                      onClick={() => sendCommand(player.id, 'refresh')}
                      className="btn btn-secondary flex-1 text-xs"
                    >
                      <RefreshCw size={12} />
                      Refresh
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{playlist.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{playlist.description}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Créé le {new Date(playlist.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border-subtle)] flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {group.player_count} player{group.player_count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
