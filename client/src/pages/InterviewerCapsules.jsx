import { useEffect, useState } from "react";
import api from "../services/api";

function InterviewerCapsules() {
    const [capsules, setCapsules] = useState([]);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [pdfUrl, setPdfUrl] = useState(null);
    const [activeCapsuleTitle, setActiveCapsuleTitle] = useState("");

    const loadCapsules = () => {
        api
            .get("/capsules/assigned/me")
            .then((res) => setCapsules(res.data.capsules))
            .catch(() => setError("Failed to load capsules"));
    };

    useEffect(() => {
        loadCapsules();
    }, []);

    const requestLocationAndUnlock = (capsule) => {
        setStatus("");
        setError("");
        setPdfUrl(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported in this browser");
            return;
        }

        setStatus("Requesting your location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setStatus("Verifying identity, time, and location...");

                try {
                    const res = await api.post(
                        `/capsules/${capsule._id}/unlock`,
                        { latitude, longitude },
                        { responseType: "blob" }
                    );

                    const blob = new Blob([res.data], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);

                    setPdfUrl(url);
                    setActiveCapsuleTitle(capsule.title);
                    setStatus("Capsule unlocked successfully. Document is displayed below.");
                    loadCapsules();
                } catch (err) {
                    if (err.response && err.response.data) {
                        try {
                            const text = await err.response.data.text();
                            const parsed = JSON.parse(text);
                            setError(parsed.message || "Failed to unlock capsule");
                        } catch {
                            setError("Failed to unlock capsule");
                        }
                    } else {
                        setError("Failed to unlock capsule");
                    }
                }
            },
            () => {
                setError("Location permission denied or unavailable");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h2>My Assigned Capsules</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {status && <p style={{ color: "green" }}>{status}</p>}

            <ul>
                {capsules.map((c) => (
                    <li key={c._id} style={{ marginBottom: "1rem" }}>
                        <div>
                            <strong>{c.title}</strong> — status: {c.status}
                        </div>
                        <div>Unlock time: {new Date(c.unlockTime).toLocaleString()}</div>
                        <button
                            disabled={c.status === "expired"}
                            onClick={() => requestLocationAndUnlock(c)}
                        >
                            {c.status === "unlocked" ? "View Again" : "Unlock"}
                        </button>
                    </li>
                ))}
            </ul>

            {pdfUrl && (
                <div style={{ marginTop: "2rem" }}>
                    <h3>Viewing: {activeCapsuleTitle}</h3>
                    <iframe
                        src={pdfUrl}
                        title="Unlocked Document"
                        width="100%"
                        height="600px"
                        style={{ border: "1px solid #ccc" }}
                    />
                    <div style={{ marginTop: "0.5rem" }}>
                        <a href={pdfUrl} download={`${activeCapsuleTitle}.pdf`}>
                            Download PDF
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InterviewerCapsules;