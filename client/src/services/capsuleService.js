import api from "./api";

export const createCapsule = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });
    const res = await api.post("/capsules", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

export const fetchMyCapsules = async () => {
    const res = await api.get("/capsules/my");
    return res.data.capsules;
};