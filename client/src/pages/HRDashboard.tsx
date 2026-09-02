import { useState } from 'react';
import CreateUser from './CreateUser';
import CreateCapsule from './CreateCapsule';
import UserList from './UserList';

function HRDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="w-full font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage users and assign encrypted time capsules.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('capsules')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'capsules'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Capsule Management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'users' ? (
          <div className="space-y-8 lg:flex lg:space-y-0 lg:gap-8 items-start">
            <div className="w-full lg:w-1/3">
              <CreateUser />
            </div>
            <div className="w-full lg:w-2/3">
              <UserList />
            </div>
          </div>
        ) : (
          <div>
            <CreateCapsule />
          </div>
        )}
      </div>
    </div>
  );
}

export default HRDashboard;
