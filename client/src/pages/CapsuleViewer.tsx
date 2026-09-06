import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Clock, AlertCircle, CheckCircle, ArrowLeft, Loader } from "lucide-react";
import api from "../services/api";

type CapsuleStatus = "pending" | "unlocked" | "expired";

interface Capsule {
    _id: string;
    title: string;
    description?: string;
    unlockTime: string;
    expiryTime?: string;
    radiusMeters: number;
    status: CapsuleStatus;
    isUnlocked: boolean;
    fileName: string;
}

type Phase = "loading" | "ready" | "locating" | "verifying" | "unlocked" | "error";

function CapsuleViewer() {
    const { id } = useParams<{ id: string }>();
    const [capsule, setCapsule] = useState<Capsule | null>(null);
    const [phase, setPhase] = useState<Phase>("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        api.get("/capsules/assigned/me")
            .then((res) => {
                const found = res.data.capsules.find((c: Capsule) => c._id === id);
                if (!found) {
                    setErrorMsg("Capsule not found or not assigned to you.");
                    setPhase("error");
                } else {
                    setCapsule(found);
                    // If already unlocked in a previous session, go straight to unlock UI
                    setPhase(found.status === "unlocked" ? "ready" : "ready");
                }
            })
            .catch(() => {
                setErrorMsg("Failed to load capsule details.");
                setPhase("error");
            });
    }, [id]);

    const handleUnlock = () => {
        setErrorMsg("");
        setPdfUrl(null);

        if (!navigator.geolocation) {
            setErrorMsg("Geolocation is not supported by your browser.");
            return;
        }

        setPhase("locating");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setPhase("verifying");
                const { latitude, longitude } = position.coords;
                try {
                    const res = await api.post(
                        `/capsules/${id}/unlock`,
                        { latitude, longitude },
                        { responseType: "blob" }
                    );
                    const blob = new Blob([res.data], { type: "application/pdf" });
                    setPdfUrl(URL.createObjectURL(blob));
                    setPhase("unlocked");
                    setCapsule((prev) => prev ? { ...prev, status: "unlocked", isUnlocked: true } : prev);
                } catch (err: any) {
                    let msg = "Failed to unlock capsule.";
                    if (err.response?.data) {
                        try {
                            const text = await (err.response.data as Blob).text();
                            msg = JSON.parse(text).message || msg;
                        } catch { /* use default */ }
                    }
                    setErrorMsg(msg);
                    setPhase("ready");
                }
            },
            (posErr) => {
                const reasons: Record<number, string> = {
                    1: "Location permission denied. Please allow location access and try again.",
                    2: "Location unavailable. Check your GPS or network.",
                    3: "Location request timed out. Please try again.",
                };
                setErrorMsg(reasons[posErr.code] || "Could not determine your location.");
                setPhase("ready");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    if (phase === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[300px] gap-3 text-gray-500">
                <Loader className="animate-spin w-5 h-5" />
                <span>Loading capsule...</span>
            </div>
        );
    }

    if (phase === "error" || !capsule) {
        return (
            <div className="max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium">{errorMsg}</p>
                <Link to="/interviewer" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                    ? Back to dashboard
                </Link>
            </div>
        );
    }

    const isExpired = capsule.status === "expired";
    const isLocked = new Date() < new Date(capsule.unlockTime);

    return (
        <div className="max-w-2xl mx-auto space-y-6">

            {/* Back link */}
            <Link to="/interviewer" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to all capsules
            </Link>

            {/* Capsule info card */}
            <div className="bg-white ring-1 ring-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{capsule.title}</h1>
                        {capsule.description && (
                            <p className="text-sm text-gray-500 mt-1">{capsule.description}</p>
                        )}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                        capsule.status === "unlocked" ? "bg-green-100 text-green-700" :
                        capsule.status === "expired"  ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                    }`}>
                        {capsule.status}
                    </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Unlocks: <strong>{new Date(capsule.unlockTime).toLocaleString()}</strong></span>
                    </div>
                    {capsule.expiryTime && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-400" />
                            <span>Expires: <strong>{new Date(capsule.expiryTime).toLocaleString()}</strong></span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-400" />
                        <span>Required radius: <strong>{capsule.radiusMeters}m</strong></span>
                    </div>
                </div>
            </div>

            {/* Status / action area */}
            {isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm font-medium">This capsule has expired and can no longer be unlocked.</p>
                </div>
            ) : isLocked ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                    <p className="text-yellow-800 text-sm font-medium">
                        This capsule is locked until <strong>{new Date(capsule.unlockTime).toLocaleString()}</strong>. Come back then!
                    </p>
                </div>
            ) : (
                <div className="bg-white ring-1 ring-gray-200 rounded-xl p-6 shadow-sm text-center space-y-4">
                    {phase === "locating" && (
                        <div className="flex flex-col items-center gap-3 text-indigo-600">
                            <Loader className="animate-spin w-6 h-6" />
                            <p className="text-sm font-medium">Requesting your location...</p>
                        </div>
                    )}
                    {phase === "verifying" && (
                        <div className="flex flex-col items-center gap-3 text-indigo-600">
                            <Loader className="animate-spin w-6 h-6" />
                            <p className="text-sm font-medium">Verifying identity, time, and location...</p>
                        </div>
                    )}
                    {phase === "unlocked" && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <p className="text-sm font-semibold">Capsule unlocked successfully!</p>
                        </div>
                    )}
                    {phase === "ready" && (
                        <>
                            <p className="text-sm text-gray-600">
                                Click below to verify your location and unlock the document.
                                Make sure location permissions are enabled.
                            </p>
                            <button
                                onClick={handleUnlock}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow transition-all"
                            >
                                <MapPin className="inline w-4 h-4 mr-2" />
                                {capsule.isUnlocked ? "View Again" : "Unlock with Location"}
                            </button>
                        </>
                    )}

                    {errorMsg && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm text-left">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>
            )}

            {/* PDF viewer */}
            {pdfUrl && (
                <div className="bg-white ring-1 ring-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900">?? {capsule.fileName}</h2>
                        <a
                            href={pdfUrl}
                            download={capsule.fileName}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                            Download PDF
                        </a>
                    </div>
                    <iframe
                        src={pdfUrl}
                        title="Unlocked Document"
                        className="w-full h-screen min-h-[600px] border border-gray-200 rounded-lg shadow-sm"
                    />
                </div>
            )}
        </div>
    );
}

export default CapsuleViewer;
