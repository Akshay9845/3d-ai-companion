import { Activity, Calendar, Eye, Trash2, User, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { RecognizedUser, userRecognitionService } from '../lib/userRecognitionService';

interface UserManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<RecognizedUser[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, lastSeenToday: 0, newThisWeek: 0 });
  const [selectedUser, setSelectedUser] = useState<RecognizedUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = () => {
    const allUsers = userRecognitionService.getAllUsers();
    const userStats = userRecognitionService.getStats();
    
    // Sort users by last seen (most recent first)
    allUsers.sort((a, b) => b.lastSeen - a.lastSeen);
    
    setUsers(allUsers);
    setStats(userStats);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      userRecognitionService.removeUser(userId);
      loadUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    }
  };

  const handleClearAllUsers = () => {
    if (confirm('Are you sure you want to delete ALL users? This action cannot be undone.')) {
      userRecognitionService.clearAllUsers();
      loadUsers();
      setSelectedUser(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeSince = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-4xl w-full max-h-[80vh] shadow-2xl flex">
        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">User Management</h3>
                <p className="text-sm text-slate-400">Manage recognized users and face data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="p-6 border-b border-slate-600">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</p>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Active Today</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.lastSeenToday}</p>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">New This Week</span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">{stats.newThisWeek}</p>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">Recognized Users</h4>
              {users.length > 0 && (
                <button
                  onClick={handleClearAllUsers}
                  className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No users registered yet</p>
                <p className="text-sm text-slate-500 mt-1">Turn on the camera to start recognizing faces</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-medium text-white">{user.name}</h5>
                          <p className="text-sm text-slate-400">
                            {user.sessionCount} visit{user.sessionCount !== 1 ? 's' : ''} • Last seen {formatTimeSince(user.lastSeen)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Details Sidebar */}
        {selectedUser && (
          <div className="w-80 border-l border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-medium text-white">User Details</h4>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <p className="text-white font-medium">{selectedUser.name}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">User ID</label>
                <p className="text-white font-mono text-sm">{selectedUser.id}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">First Seen</label>
                <p className="text-white">{formatDate(selectedUser.firstSeen)}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Last Seen</label>
                <p className="text-white">{formatDate(selectedUser.lastSeen)}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Total Visits</label>
                <p className="text-white">{selectedUser.sessionCount}</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Recognition Confidence</label>
                <p className="text-white">{(selectedUser.confidence * 100).toFixed(1)}%</p>
              </div>

              <div>
                <label className="text-sm text-slate-400">Face Descriptor Size</label>
                <p className="text-white">{selectedUser.faceDescriptor.length} dimensions</p>
              </div>

              <div className="pt-4 border-t border-slate-600">
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPanel; 