import { useEffect, useState } from "react";
import { fetchInterviewers } from "../services/userService";
import { createCapsule, fetchMyCapsules, deleteCapsule } from "../services/capsuleService";
import LocationPickerMap from "../components/LocationPickerMap";
import Avatar from "../components/Avatar";

function CreateCapsule() {
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
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);

        if (!form.receiverId) {
            setError("Please select an interviewer");
            setIsLoading(false);
            return;
        }

        if (form.latitude == null || form.longitude == null) {
            setError("Please select a location on the map");
            setIsLoading(false);
            return;
        }

        if (!form.file) {
            setError("Please upload a PDF file");
            setIsLoading(false);
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
                unlockTime: new Date(form.unlockTime).toISOString(),
                expiryTime: form.expiryTime ? new Date(form.expiryTime).toISOString() : undefined,
                file: form.file,
            });

            setStatus("Capsule created successfully");
            const updated = await fetchMyCapsules();
            setCapsules(updated);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create capsule");
        } finally {
            setIsLoading(false);
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
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl p-6 font-sans">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-6">Create New Capsule</h2>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        placeholder="e.g. Q3 Technical Interview Questions"
                        value={form.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        required
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        placeholder="Brief context for the interviewer..."
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors h-24"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Assign To (Interviewer)</label>
                    <select
                        value={form.receiverId}
                        onChange={(e) => handleChange("receiverId", e.target.value)}
                        required
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unlock Location</label>
                    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                        <LocationPickerMap
                            latitude={form.latitude}
                            longitude={form.longitude}
                            radiusMeters={form.radiusMeters}
                            onChange={handleMapChange}
                        />
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex gap-4">
                        <p><strong>Lat:</strong> {form.latitude != null ? Number(form.latitude).toFixed(6) : "None"}</p>
                        <p><strong>Lng:</strong> {form.longitude != null ? Number(form.longitude).toFixed(6) : "None"}</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                    <input
                        type="number"
                        placeholder="Radius in meters"
                        value={form.radiusMeters}
                        onChange={(e) => handleChange("radiusMeters", e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unlock Time</label>
                        <input
                            type="datetime-local"
                            value={form.unlockTime}
                            onChange={(e) => handleChange("unlockTime", e.target.value)}
                            required
                            className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Time (Optional)</label>
                        <input
                            type="datetime-local"
                            value={form.expiryTime}
                            onChange={(e) => handleChange("expiryTime", e.target.value)}
                            className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Document (PDF)</label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        required
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                {status && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{status}</p>}

                <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isLoading ? "Processing..." : "Create Capsule"}
                </button>
            </form>

            <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">My Capsules</h3>
                {capsules.length === 0 ? (
                    <p className="text-sm text-gray-500">You haven't created any capsules yet.</p>
                ) : (
                    <ul className="space-y-4">
                        {capsules.map((c) => (
                            <li key={c._id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900">{c.title}</h4>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-500">Assigned to:</span>
                                        <Avatar src={c.receiverId?.profileImage} name={c.receiverId?.name} size="xs" />
                                        <span className="text-sm font-medium text-gray-700">{c.receiverId?.name}</span>
                                        <span className="text-xs text-gray-400">({c.receiverId?.email})</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 space-x-2">
                                        <span>Status: <span className="font-semibold text-gray-600">{c.status}</span></span>
                                        <span>•</span>
                                        <span>Lat: {Number(c.location?.coordinates[1] ?? c.latitude).toFixed(4)}, Lng: {Number(c.location?.coordinates[0] ?? c.longitude).toFixed(4)}</span>
                                        <span>•</span>
                                        <span>Radius: {c.radiusMeters}m</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(c._id)}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default CreateCapsule;