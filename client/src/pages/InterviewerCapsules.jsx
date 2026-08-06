import { useEffect, useState } from "react";
import api from "../services/api";

function InterviewerCapsules() {
    const [capsules, setCapsules] = useState([]);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/capsules/assigned/me")
            .then((res) => setCapsules(res.data.capsules))
            .catch(() => setError("Failed to load capsules"));
    }, []);

    const requestLocationAndUnlock = (capsuleId) => {
        setStatus("");
        setError("");

        if (!navigator.geolocation) {
            setError("Geolocation is not supported in this browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await api.post(`/capsules/${capsuleId}/unlock`, {
                        latitude,
                        longitude,
                    });
                    setStatus(res.data.message || "Capsule unlocked");
                } catch (err) {
                    setError(err.response?.data?.message || "Failed to unlock capsule");
                }
            },
            (err) => {
                setError("Location permission denied or unavailable");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h2>My Capsules</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {status && <p style={{ color: "green" }}>{status}</p>}
            <ul>
                {capsules.map((c) => (
                    <li key={c._id}>
                        <div>
                            <strong>{c.title}</strong> – status: {c.status}
                        </div>
                        <button
                            disabled={c.status !== "pending"}
                            onClick={() => requestLocationAndUnlock(c._id)}
                        >
                            Unlock
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default InterviewerCapsules;