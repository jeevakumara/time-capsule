import { useEffect, useState } from "react";
import { fetchInterviewers } from "../services/userService";
import { createCapsule, fetchMyCapsules } from "../services/capsuleService";

function CreateCapsule() {
    const [interviewers, setInterviewers] = useState([]);
    const [capsules, setCapsules] = useState([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        receiverId: "",
        latitude: "",
        longitude: "",
        radiusMeters: 100,
        unlockTime: "",
        expiryTime: "",
        file: null,
    });
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchInterviewers().then(setInterviewers).catch(console.error);
        fetchMyCapsules().then(setCapsules).catch(console.error);
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        handleChange("file", e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");

        try {
            await createCapsule({
                title: form.title,
                description: form.description,
                receiverId: form.receiverId,
                latitude: form.latitude,
                longitude: form.longitude,
                radiusMeters: form.radiusMeters,
                unlockTime: form.unlockTime,
                expiryTime: form.expiryTime || undefined,
                file: form.file,
            });

            setStatus("Capsule created successfully");
            const updated = await fetchMyCapsules();
            setCapsules(updated);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create capsule");
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Create Capsule</h2>
            <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
                <input
                    placeholder="Title"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <select
                    value={form.receiverId}
                    onChange={(e) => handleChange("receiverId", e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                >
                    <option value="">Select Interviewer</option>
                    {interviewers.map((u) => (
                        <option key={u._id} value={u._id}>
                            {u.name} ({u.email})
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    step="0.000001"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={(e) => handleChange("latitude", e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <input
                    type="number"
                    step="0.000001"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <input
                    type="number"
                    placeholder="Radius (meters)"
                    value={form.radiusMeters}
                    onChange={(e) => handleChange("radiusMeters", e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <label>Unlock Time</label>
                <input
                    type="datetime-local"
                    value={form.unlockTime}
                    onChange={(e) => handleChange("unlockTime", e.target.value)}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <label>Expiry Time (optional)</label>
                <input
                    type="datetime-local"
                    value={form.expiryTime}
                    onChange={(e) => handleChange("expiryTime", e.target.value)}
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    required
                    style={{ display: "block", width: "100%", marginBottom: 10 }}
                />

                {error && <p style={{ color: "red" }}>{error}</p>}
                {status && <p style={{ color: "green" }}>{status}</p>}

                <button type="submit">Create Capsule</button>
            </form>

            <hr style={{ margin: "2rem 0" }} />
            <h3>My Capsules</h3>
            <ul>
                {capsules.map((c) => (
                    <li key={c._id}>
                        {c.title} → {c.receiverId?.name} ({c.receiverId?.email}) – status: {c.status}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CreateCapsule;