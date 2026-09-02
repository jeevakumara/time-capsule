import { useState } from "react";
import api from "../services/api";

function CreateUser() {
    const [form, setForm] = useState({ name: "", email: "", employeeId: "", role: "interviewer", profileImage: null });
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("email", form.email);
            formData.append("employeeId", form.employeeId);
            formData.append("role", form.role);
            if (form.profileImage) {
                formData.append("profileImage", form.profileImage);
            }

            const res = await api.post("/users", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
            setForm({ name: "", email: "", employeeId: "", role: "interviewer", profileImage: null });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-6 max-w-md w-full font-sans">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Add Interviewer / HR</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input placeholder="Enter full name" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input placeholder="Enter email address" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <input placeholder="Optional ID" value={form.employeeId}
                        onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
                        <option value="interviewer">Interviewer</option>
                        <option value="hr">HR</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                    <input type="file" accept="image/jpeg, image/png"
                        onChange={(e) => setForm({ ...form, profileImage: e.target.files[0] })}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isLoading ? "Processing..." : "Create User"}
                </button>
            </form>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {result && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">User created: <strong>{result.user.email}</strong></p>
                    <p className="text-sm text-green-800 mt-1">Temporary password: <b className="bg-white px-2 py-0.5 rounded border border-green-300">{result.tempPassword}</b></p>
                </div>
            )}
        </div>
    );
}

export default CreateUser;