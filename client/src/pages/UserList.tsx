import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import EditUserModal from "../components/EditUserModal";

function UserList() {
    const { user: currentUser, updateUser } = useAuth();

    const [users, setUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        api.get("/users").then((res) => setUsers(res.data.users));
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await api.delete(`/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
            } catch (err) {
                alert("Error deleting user: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateSuccess = (updatedUser: any) => {
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        if (currentUser && currentUser._id === updatedUser._id) {
            updateUser(updatedUser);
        }
    };

    return (
        <>
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden font-sans">
            <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-4 w-16">Avatar</th>
                            <th className="px-4 py-4">Name</th>
                            <th className="px-4 py-4">Email</th>
                            <th className="px-4 py-4">Role</th>
                            <th className="px-4 py-4">Status</th>
                            {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && <th className="px-4 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u._id} className="hover:bg-gray-50/50 transition-colors cursor-default">
                                <td className="px-4 py-4">
                                    <Avatar src={u.profileImage} name={u.name} size="sm" />
                                </td>
                                <td className="px-4 py-4 font-medium text-gray-900">{u.name}</td>
                                <td className="px-4 py-4 text-gray-500 break-all">{u.email}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${
                                        u.role === 'admin' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' :
                                        u.role === 'hr' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                                        'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                        u.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                                        'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20'
                                    }`}>
                                        {u.status || 'active'}
                                    </span>
                                </td>
                                {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                                    <td className="px-4 py-4 text-right">
                                        {u.role === 'interviewer' && (
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => handleEditClick(u)} className="text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(u._id)} className="text-gray-500 hover:text-red-600 font-medium transition-colors">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
            
            <EditUserModal 
                user={editingUser}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleUpdateSuccess}
                currentUserRole={currentUser?.role}
            />
        </>
    );
}

export default UserList;