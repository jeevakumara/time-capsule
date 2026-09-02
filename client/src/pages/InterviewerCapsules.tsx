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
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-6 font-sans">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">My Assigned Capsules</h2>

            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</p>}
            {status && <p className="text-sm text-green-600 bg-green-50 p-2 rounded mb-4">{status}</p>}

            {capsules.length === 0 ? (
                <p className="text-sm text-gray-500">No capsules assigned to you yet.</p>
            ) : (
                <ul className="space-y-4">
                    {capsules.map((c) => (
                        <li key={c._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h4 className="font-medium text-gray-900">{c.title}</h4>
                                <div className="text-sm text-gray-500 mt-1">
                                    Unlock time: {new Date(c.unlockTime).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Status: <span className="font-semibold text-gray-600">{c.status}</span>
                                </div>
                            </div>
                            <button
                                disabled={c.status === "expired"}
                                onClick={() => requestLocationAndUnlock(c)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {c.status === "unlocked" ? "View Again" : "Unlock"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {pdfUrl && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Viewing: {activeCapsuleTitle}</h3>
                    <iframe
                        src={pdfUrl}
                        title="Unlocked Document"
                        className="w-full h-screen min-h-[600px] border border-gray-200 rounded-lg mt-4 shadow-sm"
                    />
                    <div className="mt-4">
                        <a 
                            href={pdfUrl} 
                            download={`${activeCapsuleTitle}.pdf`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            Download PDF
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InterviewerCapsules;