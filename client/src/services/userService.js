import api from "./api";

export const fetchInterviewers = async () => {
    const res = await api.get("/users?role=interviewer");
    return res.data.users;
};