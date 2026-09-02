import React, { useState, useRef, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import Avatar from './Avatar';
import api from '../services/api';

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
  currentUserRole?: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSuccess, currentUserRole }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setRole(user.role || 'interviewer');
      setFile(null);
      setPreviewUrl(null);
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (name !== user.name) formData.append('name', name);
      if (role !== user.role) formData.append('role', role);
      if (file) formData.append('profileImage', file);

      const res = await api.patch(`/users/${user._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess(res.data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred while updating the profile.');
    } finally {
      setLoading(false);
    }
  };

  const canEditRole = currentUserRole === 'admin' || currentUserRole === 'hr';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative group cursor-pointer rounded-full overflow-hidden" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar 
                  src={previewUrl || user.profileImage} 
                  name={name || user.name} 
                  size="xl" 
                  className="transition-opacity group-hover:opacity-75"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white drop-shadow-md" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              <div className="text-sm text-gray-500 font-medium">Click to change photo</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                required
              />
            </div>

            {canEditRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="interviewer">Interviewer</option>
                  <option value="hr">HR</option>
                  {currentUserRole === 'admin' && <option value="admin">Admin</option>}
                </select>
              </div>
            )}
            
            <div className="pt-2">
              <p className="text-xs text-gray-500 text-center">
                Email: <span className="font-medium text-gray-700">{user.email}</span>
                {user.employeeId && (
                  <> <span className="mx-2">•</span> ID: <span className="font-medium text-gray-700">{user.employeeId}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors focus:ring-4 focus:ring-indigo-500/30 flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
