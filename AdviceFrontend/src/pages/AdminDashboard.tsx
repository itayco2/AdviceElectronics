import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUsers, deleteUser } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Trash2, Users, Shield, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
}

const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/');
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await getUsers();
        setUsers(users);
      } catch (error) {
        setMessage({ text: 'Failed to load users', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה? פעולה זו אינה ניתנת לביטול.')) return;
    
    setDeletingId(id);
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setMessage({ text: 'המשתמש נמחק בהצלחה', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to delete user', type: 'error' });
    } finally {
      setDeletingId(null);
    }
    
    setTimeout(() => setMessage(null), 5000);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center h-24">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span>מערכת ניהול משתמשים</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-gray-500">
                שלום, <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              <button
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-full px-3 py-1 bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>חזרה לדף הבית</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">סה"כ משתמשים</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">מנהלים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'Admin').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">משתמשים רגילים</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role !== 'Admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ניהול משתמשים</h2>
            <p className="text-sm text-gray-500 mt-1">ניהול כל המשתמשים במערכת</p>
          </div>
          
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-500">טוען משתמשים...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">לא נמצאו משתמשים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      משתמש
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      הרשאה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {u.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.email}</div>
                            <div className="text-sm text-gray-500">id: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                          {getRoleIcon(u.role)}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === user.id || deletingId === u.id}
                          className="inline-flex items-center space-x-2 px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingId === u.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              <span>מוחק...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              <span>מחק</span>
                            </>
                          )}
                        </button>
                        {u.id === user.id && (
                          <p className="text-xs text-gray-500 mt-1">לא ניתן למחוק את עצמך</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;