import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

    useEffect(() => { loadCapsules(); }, []);

    // Phase 7: geolocation error codes mapped to user-friendly messages
    const GEO_ERRORS: Record<number, string> = {
        1: "Location permission denied. Please enable location access in your browser settings and try again.",
        2: "Your location could not be determined. Check that GPS/Wi-Fi is enabled.",
        3: "Location request timed out. Please try again in a moment.",
    };

    const requestLocationAndUnlock = (capsule) => {
        setStatus("");
        setError("");
        setPdfUrl(null);

        // Phase 7: browser support guard
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser. Please use a modern browser.");
            return;
        }

        setStatus("Requesting your location…");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setStatus("Verifying identity, time, and location…");

                try {
                    const res = await api.post(
                        `/capsules/${capsule._id}/unlock`,
                        { latitude, longitude },
                        { responseType: "blob" }
                    );

                    const blob = new Blob([res.data], { type: "application/pdf" });
                    setPdfUrl(URL.createObjectURL(blob));
                    setActiveCapsuleTitle(capsule.title);
                    setStatus("? Capsule unlocked successfully. Document is displayed below.");
                    loadCapsules();
                } catch (err: any) {
                    let msg = "Failed to unlock capsule.";
                    if (err.response?.data) {
                        try {
                            const text = await (err.response.data as Blob).text();
                            msg = JSON.parse(text).message || msg;
                        } catch { /* use default */ }
                    }
                    setStatus("");
                    setError(msg);
                }
            },
            // Phase 7: handle all three PositionError codes explicitly
            (posErr) => {
                setStatus("");
                setError(GEO_ERRORS[posErr.code] || "An unknown location error occurred.");
            },
            // Phase 7: maximumAge:0 forces a fresh GPS fix, not a cached stale position
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    return (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-6 font-sans">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">My Assigned Capsules</h2>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
            {status && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4">{status}</p>}

            {capsules.length === 0 ? (
                <p className="text-sm text-gray-500">No capsules assigned to you yet.</p>
            ) : (
                <ul className="space-y-4">
                    {capsules.map((c: any) => (
                        <li
                            key={c._id}
                            className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            <div>
                                <h4 className="font-medium text-gray-900">{c.title}</h4>
                                <div className="text-sm text-gray-500 mt-1">
                                    Unlock: {new Date(c.unlockTime).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Status: <span className="font-semibold text-gray-600">{c.status}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                {/* Deep-link: open the dedicated capsule viewer page */}
                                <Link
                                    to={`/interviewer/capsules/${c._id}`}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all"
                                >
                                    View Details
                                </Link>
                                <button
                                    disabled={c.status === "expired"}
                                    onClick={() => requestLocationAndUnlock(c)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {c.status === "unlocked" ? "View Again" : "Quick Unlock"}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {pdfUrl && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
                        Viewing: {activeCapsuleTitle}
                    </h3>
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
