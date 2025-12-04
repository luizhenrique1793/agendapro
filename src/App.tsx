import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";
import Register from "./pages/auth/Register";
import BookingFlow from "./pages/booking/BookingFlow";
import Dashboard from "./pages/admin/Dashboard"; // Business Dashboard
import PlatformDashboard from "./pages/admin/PlatformDashboard"; // Admin Dashboard
import Services from "./pages/admin/Services";
import Schedule from "./pages/admin/Schedule";
import Businesses from "./pages/admin/Businesses";
import Users from "./pages/admin/Users";
import UserForm from "./pages/admin/UserForm";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import Clients from "./pages/admin/Clients";
import Professionals from "./pages/admin/Professionals";
import BusinessPage from "./pages/BusinessPage";
import { AppProvider } from "./store";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminRoute } from "./components/AdminRoute";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Dynamic Public Routes */}
      <Route path="/book/:slug" element={<BookingFlow />} />
      <Route path="/p/:slug" element={<BusinessPage />} />

      {/* Redirects & Fallbacks for old links */}
      <Route path="/book" element={<Navigate to="/" replace />} />
      <Route path="/barbearia-do-ze" element={<Navigate to="/p/barbearia-do-ze" replace />} />

      {/* --- Platform Admin Routes (Super Admin) --- */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <PlatformDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/businesses"
        element={
          <AdminRoute>
            <Businesses />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users/new"
        element={
          <AdminRoute>
            <UserForm />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        }
      />

      {/* --- Business Manager Routes (Owner/Professional) --- */}
      <Route
        path="/manager"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/calendar"
        element={
          <PrivateRoute>
            <Schedule />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/clients"
        element={
          <PrivateRoute>
            <Clients />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/services"
        element={
          <PrivateRoute>
            <Services />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/professionals"
        element={
          <PrivateRoute>
            <Professionals />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;