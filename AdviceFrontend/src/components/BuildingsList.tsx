import React, { useEffect, useState } from 'react';
import { Building2, Plus, Trash2, LogOut, User, Loader2, AlertCircle, ChevronLeft, Shield, Eye, MoreVertical } from 'lucide-react';
import { getBuildingsForUser, createBuilding, deleteBuilding } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { Building } from '../types/Building';

interface BuildingsListProps {
  onSelect: (building: Building) => void;
}

const BuildingsList: React.FC<BuildingsListProps> = ({ onSelect }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [numberOfFloors, setNumberOfFloors] = useState(5);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const fetchBuildings = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBuildingsForUser(user.id);
      setBuildings(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message?: string }).message ?? 'Failed to load buildings');
      } else {
        setError('Failed to load buildings');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
    // eslint-disable-next-line
  }, [user]);

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await createBuilding({ userId: user.id, name, numberOfFloors });
      setName('');
      setNumberOfFloors(5);
      setShowAdd(false);
      fetchBuildings();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message?: string }).message ?? 'Failed to add building');
      } else {
        setError('Failed to add building');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הבניין? פעולה זו אינה הפיכה.')) return;
    setDeletingId(id);
    setError(null);
    setShowMenuId(null);
    try {
      await deleteBuilding(id);
      fetchBuildings();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message?: string }).message ?? 'שגיאה במחיקת בניין');
      } else {
        setError('שגיאה במחיקת בניין');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent)] animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23a855f7%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Header */}
      <header className="relative bg-black/20 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-lg flex items-center justify-center shadow shadow-purple-500/10">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">מערכת ניהול מעליות</h1>
                <p className="text-[10px] text-purple-300">מתקדמת וחכמה</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <User className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300 font-medium">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                יציאה
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-white mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            הבניינים שלך
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            בחר בניין לניהול או הוסף בניין חדש למערכת המתקדמת שלנו
          </p>
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
          </div>
        </div>

        {loading && !buildings.length && (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-purple-600/20 rounded-full animate-pulse"></div>
            </div>
            <p className="mt-4 text-gray-400 font-medium">טוען בניינים...</p>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-900/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          </div>
        )}

        {user?.role === 'Admin' && (
          <div className="mb-8 flex justify-center">
            <button
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg shadow-indigo-500/25"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              מערכת ניהול משתמשים
              <ChevronLeft className="w-4 h-4 ml-1 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Buildings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="group relative overflow-hidden rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer p-2"
              tabIndex={0}
              role="button"
              onClick={() => onSelect(building)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(building); }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {/* Delete Button in top-left corner */}
              <div className="absolute top-1 left-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(building.id);
                  }}
                  disabled={deletingId === building.id}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600/80 backdrop-blur-sm text-white text-sm rounded-full hover:bg-red-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
                >
                  {deletingId === building.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="mr-1">{deletingId === building.id ? 'מוחק...' : 'מחק'}</span>
                </button>
              </div>
              {/* Floor badge in top-right */}
              <div className="absolute top-1 right-1 z-10">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {building.numberOfFloors}
                </div>
              </div>
              {/* Centered building name */}
              <div className="flex items-center justify-center h-full">
                <h1 className="text-2xl font-bold text-white text-center w-full">{building.name}</h1>
              </div>
            </div>
          ))}

          {/* Add Building Card */}
          <div
            onClick={() => setShowAdd(true)}
            className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="p-8 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-700 group-hover:from-purple-900/50 group-hover:to-pink-900/50 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-lg">
                  <Plus className="w-10 h-10 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-medium text-gray-400 group-hover:text-purple-400 transition-colors duration-300">
                הוסף בניין חדש
              </span>
              <p className="text-sm text-gray-500 mt-2 text-center group-hover:text-purple-500 transition-colors duration-300">
                הרחב את המערכת שלך
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Building Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowAdd(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-gray-900/90 backdrop-blur-xl rounded-3xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl"></div>
              <div className="relative">
                <div className="text-center sm:mt-0">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    הוסף בניין חדש
                  </h3>
                  <p className="text-gray-400 mb-8">הזן את פרטי הבניין החדש</p>
                  
                  <input
                    type="text"
                    placeholder="שם הבניין"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mb-4 px-4 py-2 rounded-lg bg-gray-800 border border-purple-500 focus:border-purple-400 text-white outline-none transition-colors duration-200"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="מספר הקומות"
                    value={numberOfFloors}
                    onChange={(e) => setNumberOfFloors(Number(e.target.value))}
                    className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 border border-purple-500 focus:border-purple-400 text-white outline-none transition-colors duration-200"
                  />
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowAdd(false)}
                      className="px-6 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={handleAdd}
                      disabled={!name || numberOfFloors < 1 || loading}
                      className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-colors duration-200"
                    >
                      {loading ? 'שומר...' : 'שמור'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuildingsList;
