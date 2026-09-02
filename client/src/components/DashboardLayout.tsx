import React, { ReactNode, useState } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import EditUserModal from './EditUserModal';

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  hr: 'bg-green-100 text-green-800',
  interviewer: 'bg-blue-100 text-blue-800',
};

function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/80 shadow-sm px-6 py-4 w-full">
        {/* Left side: Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            Time Capsule
          </span>
        </div>

        {/* Right side: User info & Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-100/50 p-2 -my-2 rounded-xl transition-colors"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Profile"
            >
              <Avatar src={user.profileImage} name={user.name} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700 leading-tight">
                  {user.name}
                </span>
                <span
                  className={`px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold uppercase tracking-wide w-max ${
                    roleColors[user.role] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <EditUserModal 
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updatedUser) => updateUser(updatedUser)}
        currentUserRole={user?.role}
      />
    </div>
  );
}

export default DashboardLayout;
