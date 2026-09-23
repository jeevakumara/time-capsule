import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import UserList from "./pages/UserList";
import HRDashboard from "./pages/HRDashboard";
import InterviewerCapsules from "./pages/InterviewerCapsules";
import CapsuleViewer from "./pages/CapsuleViewer";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    {/* Admin */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <DashboardLayout>
                                    <UserList />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* HR */}
                    <Route
                        path="/hr"
                        element={
                            <ProtectedRoute allowedRoles={["hr", "admin"]}>
                                <DashboardLayout>
                                    <HRDashboard />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Interviewer � dashboard */}
                    <Route
                        path="/interviewer"
                        element={
                            <ProtectedRoute allowedRoles={["interviewer"]}>
                                <DashboardLayout>
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">Interviewer Dashboard</h2>
                                        <p className="text-gray-500 mt-1">View and unlock time capsules assigned to you.</p>
                                    </div>
                                    <InterviewerCapsules />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Phase 5+6: deep-link target � capsule-specific view */}
                    <Route
                        path="/interviewer/capsules/:id"
                        element={
                            <ProtectedRoute allowedRoles={["interviewer"]}>
                                <DashboardLayout>
                                    <CapsuleViewer />
                                </DashboardLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch-all */}
                    <Route path="*" element={<Login />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
