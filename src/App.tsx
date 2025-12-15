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
import WhatsappSettings from "./pages/admin/WhatsappSettings";
import Clients from "./pages/admin/Clients";
import Professionals from "./pages/admin/Professionals";
import Reminders from "./pages/admin/Reminders";
import Plans from "./pages/admin/Plans"; // Nova página de planos
import Billing from "./pages/manager/Billing"; // Nova página de billing
import BusinessPage from "./pages/BusinessPage";
import { AppProvider } from "./store";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminRoute } from "./components/AdminRoute";
import { BillingGuard } from "./components/BillingGuard"; // Importar o guard

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
      <Route path="/admin" element={<AdminRoute><PlatformDashboard /></AdminRoute>} />
      <Route path="/admin/businesses" element={<AdminRoute><Businesses /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/admin/users/new" element={<AdminRoute><UserForm /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/admin/plans" element={<AdminRoute><Plans /></AdminRoute>} />

      {/* --- Business Manager Routes (Owner/Professional) --- */}
      <Route path="/manager" element={<PrivateRoute><BillingGuard><Dashboard /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/calendar" element={<PrivateRoute><BillingGuard><Schedule /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/clients" element={<PrivateRoute><BillingGuard><Clients /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/services" element={<PrivateRoute><BillingGuard><Services /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/professionals" element={<PrivateRoute><BillingGuard><Professionals /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/whatsapp" element={<PrivateRoute><BillingGuard><WhatsappSettings /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/settings" element={<PrivateRoute><BillingGuard><Settings /></BillingGuard></PrivateRoute>} />
      <Route path="/manager/reminders" element={<PrivateRoute><BillingGuard><Reminders /></BillingGuard></PrivateRoute>} />
      
      {/* Billing page is guarded by PrivateRoute but not BillingGuard itself */}
      <Route path="/manager/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
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