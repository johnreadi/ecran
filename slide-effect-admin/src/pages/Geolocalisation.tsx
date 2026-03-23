import { useState, useEffect } from 'react';
import { MapPin, Monitor, RefreshCw } from 'lucide-react';
import api from '../api';

interface PlayerLocation {
  id: string;
  player_id: string;
  latitude: number;
  longitude: number;
  address: string;
  player_name: string;
  player_status: string;
  workspace_name: string;
  user_name: string;
  user_email: string;
  updated_at: string;
}

export default function Geolocalisation() {
  const [locations, setLocations] = useState<PlayerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0 });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await api.get('/geolocation/players/locations');
      setLocations(response.data);
      
      const online = response.data.filter((l: PlayerLocation) => l.player_status === 'online').length;
      setStats({
        total: response.data.length,
        online,
        offline: response.data.length - online,
      });
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="text-indigo-600" />
          Géolocalisation des Players
        </h1>
        <button
          onClick={loadLocations}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Monitor className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Players total</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
              <p className="text-sm text-gray-500">En ligne</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.offline}</p>
              <p className="text-sm text-gray-500">Hors ligne</p>
            </div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Player</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Utilisateur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Position</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Dernière mise à jour</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{loc.player_name}</div>
                  <div className="text-sm text-gray-500">{loc.workspace_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{loc.user_name}</div>
                  <div className="text-sm text-gray-500">{loc.user_email}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{loc.address}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    loc.player_status === 'online'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      loc.player_status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    {loc.player_status === 'online' ? 'En ligne' : 'Hors ligne'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(loc.updated_at).toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {locations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Aucune position enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
}
