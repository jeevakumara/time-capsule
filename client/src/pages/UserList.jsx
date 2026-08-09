import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function UserList() {
    const { user: currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const [users, setUsers] = useState([]);

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

    const handleUpdate = async (user) => {
        const newName = window.prompt("Enter new name:", user.name);
        if (newName === null) return;
        const newRole = window.prompt("Enter new role (admin, hr, interviewer):", user.role);
        if (newRole === null) return;
        
        if (newName || newRole) {
            try {
                await api.patch(`/users/${user._id}`, { name: newName, role: newRole });
                setUsers(users.map(u => u._id === user._id ? { ...u, name: newName, role: newRole } : u));
            } catch (err) {
                alert("Error updating user: " + (err.response?.data?.message || err.message));
            }
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <button onClick={handleLogout} style={{ marginBottom: "1rem" }}>
                Logout
            </button>
            <h2>Registered Users</h2>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.status}</td>
                            {(currentUser?.role === 'hr' || currentUser?.role === 'admin') && (
                                <td>
                                    {u.role === 'interviewer' && (
                                        <>
                                            <button onClick={() => handleUpdate(u)}>Edit</button>
                                            <button onClick={() => handleDelete(u._id)} style={{ marginLeft: "0.5rem", color: "red" }}>Delete</button>
                                        </>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserList;