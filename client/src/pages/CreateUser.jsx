import { useState } from "react";
import api from "../services/api";

function CreateUser() {
    const [form, setForm] = useState({ name: "", email: "", employeeId: "", role: "interviewer" });
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post("/users", form);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create user");
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: 400 }}>
            <h2>Add Interviewer / HR</h2>
            <form onSubmit={handleSubmit}>
                <input placeholder="Name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 10 }} required />
                <input placeholder="Email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 10 }} required />
                <input placeholder="Employee ID" value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 10 }} />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}>
                    <option value="interviewer">Interviewer</option>
                    <option value="hr">HR</option>
                </select>
                <button type="submit">Create User</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {result && (
                <div style={{ marginTop: 10 }}>
                    <p>User created: {result.user.email}</p>
                    <p>Temporary password: <b>{result.tempPassword}</b></p>
                </div>
            )}
        </div>
    );
}

export default CreateUser;