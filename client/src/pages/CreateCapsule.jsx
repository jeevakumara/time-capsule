import { useEffect, useState } from "react";
import { fetchInterviewers } from "../services/userService";
import { createCapsule, fetchMyCapsules, deleteCapsule } from "../services/capsuleService";
import LocationPickerMap from "../components/LocationPickerMap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function CreateCapsule() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const [interviewers, setInterviewers] = useState([]);
    const [capsules, setCapsules] = useState([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        receiverId: "",
        latitude: null,
        longitude: null,
        radiusMeters: 100,
        unlockTime: "",
        expiryTime: "",
        file: null,
    });
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const interviewerList = await fetchInterviewers();
                setInterviewers(interviewerList);

                const myCapsules = await fetchMyCapsules();
                setCapsules(myCapsules);
            } catch (err) {
                console.error(err);
            }
        };

        loadData();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e) => {
        handleChange("file", e.target.files[0]);
    };

    const handleMapChange = ({ latitude, longitude }) => {
        handleChange("latitude", latitude);
        handleChange("longitude", longitude);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");

        if (!form.receiverId) {
            setError("Please select an interviewer");
            return;
        }

        if (form.latitude == null || form.longitude == null) {
            setError("Please select a location on the map");
            return;
        }

        if (!form.file) {
            setError("Please upload a PDF file");
            return;
        }

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this capsule? This action cannot be undone.")) return;

        setStatus("");
        setError("");

        try {
            await deleteCapsule(id);
            setStatus("Capsule deleted successfully");
            const updated = await fetchMyCapsules();
            setCapsules(updated);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete capsule");
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <button onClick={handleLogout} style={{ marginBottom: "1rem" }}>
                Logout
            </button>
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
                    {Array.isArray(interviewers) && interviewers.length > 0 ? (
                        interviewers.map((u) => (
                            <option key={u._id} value={u._id}>
                                {u.name} ({u.email})
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>
                            No interviewers available
                        </option>
                    )}
                </select>

                <LocationPickerMap
                    latitude={form.latitude}
                    longitude={form.longitude}
                    radiusMeters={form.radiusMeters}
                    onChange={handleMapChange}
                />

                <div style={{ marginBottom: "1rem" }}>
                    <p>
                        <strong>Selected Latitude:</strong>{" "}
                        {form.latitude != null ? Number(form.latitude).toFixed(6) : "Not selected"}
                    </p>
                    <p>
                        <strong>Selected Longitude:</strong>{" "}
                        {form.longitude != null ? Number(form.longitude).toFixed(6) : "Not selected"}
                    </p>
                </div>

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
                    <li key={c._id} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
                        <div>
                            <strong>{c.title}</strong> → {c.receiverId?.name} ({c.receiverId?.email}) – status:{" "}
                            {c.status}
                        </div>
                        <div>
                            Lat: {c.latitude}, Lng: {c.longitude}, Radius: {c.radiusMeters}m
                        </div>
                        <button
                            onClick={() => handleDelete(c._id)}
                            style={{ marginTop: "10px", backgroundColor: "#ff4d4f", color: "white", border: "none", padding: "5px 10px", borderRadius: "3px", cursor: "pointer" }}
                        >
                            Delete Capsule
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CreateCapsule;