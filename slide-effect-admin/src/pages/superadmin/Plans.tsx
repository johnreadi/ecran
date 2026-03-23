import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, DollarSign, Monitor, Smartphone } from 'lucide-react';
import api from '../../api';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_players: number;
  max_screens: number;
  max_storage_mb: number;
  features: string[];
  is_active: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    max_players: 1,
    max_screens: 1,
    max_storage_mb: 100,
    features: [] as string[],
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/plans/all');
      setPlans(response.data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/plans', formData);
      }
      setShowForm(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce forfait ?')) return;
    try {
      await api.delete(`/plans/${id}`);
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price_monthly: plan.price_monthly || 0,
      price_yearly: plan.price_yearly || 0,
      max_players: plan.max_players || 1,
      max_screens: plan.max_screens || 1,
      max_storage_mb: plan.max_storage_mb || 100,
      features: Array.isArray(plan.features) ? plan.features : [],
      stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
      stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      max_players: 1,
      max_screens: 1,
      max_storage_mb: 100,
      features: [],
      stripe_price_id_monthly: '',
      stripe_price_id_yearly: '',
    });
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Forfaits</h1>
        <button
          onClick={() => {
            setEditingPlan(null);
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={20} />
          Nouveau forfait
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPlan ? 'Modifier le forfait' : 'Nouveau forfait'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix mensuel (centimes)
                  </label>
                  <input
                    type="number"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix annuel (centimes)
                  </label>
                  <input
                    type="number"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Players
                  </label>
                  <input
                    type="number"
                    value={formData.max_players}
                    onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Screens
                  </label>
                  <input
                    type="number"
                    value={formData.max_screens}
                    onChange={(e) => setFormData({ ...formData, max_screens: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stockage (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.max_storage_mb}
                    onChange={(e) => setFormData({ ...formData, max_storage_mb: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fonctionnalités</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Ajouter une fonctionnalité..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="hover:text-indigo-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Price ID (Mensuel)
                  </label>
                  <input
                    type="text"
                    value={formData.stripe_price_id_monthly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="price_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stripe Price ID (Annuel)
                  </label>
                  <input
                    type="text"
                    value={formData.stripe_price_id_yearly}
                    onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="price_..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingPlan ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl border-2 p-6 ${
              plan.is_active ? 'border-indigo-500' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(plan)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                  {(plan.price_monthly / 100).toFixed(2)}€
                </span>
                <span className="text-gray-500">/mois</span>
              </div>
              <div className="text-sm text-gray-500">
                ou {(plan.price_yearly / 100).toFixed(2)}€/an
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Smartphone size={16} className="text-indigo-500" />
                <span>{plan.max_players} players</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Monitor size={16} className="text-indigo-500" />
                <span>{plan.max_screens} écrans</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign size={16} className="text-indigo-500" />
                <span>{plan.max_storage_mb} MB stockage</span>
              </div>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Inclus :</h4>
                <ul className="space-y-1">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check size={14} className="text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!plan.is_active && (
              <div className="mt-4 px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full inline-block">
                Inactif
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
