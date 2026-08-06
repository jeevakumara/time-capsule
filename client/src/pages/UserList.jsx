import { useEffect, useState } from "react";
import api from "../services/api";

function UserList() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        api.get("/users").then((res) => setUsers(res.data.users));
    }, []);

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Registered Users</h2>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserList;