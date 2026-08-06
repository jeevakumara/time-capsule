import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import UserList from "./pages/UserList";
import CreateUser from "./pages/CreateUser";
import CreateCapsule from "./pages/CreateCapsule";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}><UserList /></ProtectedRoute>
          } />
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={["hr", "admin"]}><CreateUser /><CreateCapsule /></ProtectedRoute>
          } />
          <Route path="/interviewer" element={
            <ProtectedRoute allowedRoles={["interviewer"]}><h2>Interviewer Dashboard</h2></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
export default App;