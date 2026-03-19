import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedHRRoute } from "@/components/ProtectedHRRoute";
import { ProtectedSuperAdminRoute } from "@/components/ProtectedSuperAdminRoute";
import { ProtectedAssociationRoute } from "@/components/ProtectedAssociationRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Experiences from "./pages/Experiences";
import MyBookings from "./pages/MyBookings";
import Impact from "./pages/Impact";
import Profile from "./pages/Profile";
import HRDashboard from "./pages/HRDashboard";
import HRExperiencesPage from "./pages/hr/HRExperiencesPage";
import HREmployeesPage from "./pages/hr/HREmployeesPage";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminProfile from "./pages/super-admin/SuperAdminProfile";
import CompaniesPage from "./pages/super-admin/CompaniesPage";
import ExperiencesPage from "./pages/super-admin/ExperiencesPage";

import UsersPage from "./pages/super-admin/UsersPage";
import AssociationsPage from "./pages/super-admin/AssociationsPage";
import CitiesPage from "./pages/super-admin/CitiesPage";
import CategoriesPage from "./pages/super-admin/CategoriesPage";
import EmailTemplatesPage from "./pages/super-admin/EmailTemplatesPage";
import AccessCodesPage from "./pages/super-admin/AccessCodesPage";
import AssociationHome from "./pages/association/AssociationHome";
import AssociationExperiencesPage from "./pages/association/AssociationExperiencesPage";
import AssociationHistoryPage from "./pages/association/AssociationHistoryPage";
import AssociationProfilePage from "./pages/association/AssociationProfilePage";
import AssociationAdminProfile from "./pages/association/AssociationAdminProfile";
import AssociationCalendarPage from "./pages/association/AssociationCalendarPage";
import HRProfile from "./pages/hr/HRProfile";
import AccessRequestsPage from "./pages/super-admin/AccessRequestsPage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/app/experiences"
              element={
                <ProtectedRoute>
                  <Experiences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impact"
              element={
                <ProtectedRoute>
                  <Impact />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr"
              element={
                <ProtectedHRRoute>
                  <HRDashboard />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/experiences"
              element={
                <ProtectedHRRoute>
                  <HRExperiencesPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/employees"
              element={
                <ProtectedHRRoute>
                  <HREmployeesPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/profile"
              element={
                <ProtectedHRRoute>
                  <HRProfile />
                </ProtectedHRRoute>
              }
            />
            {/* Super Admin Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedSuperAdminRoute>
                  <SuperAdminDashboard />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/companies"
              element={
                <ProtectedSuperAdminRoute>
                  <CompaniesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/experiences"
              element={
                <ProtectedSuperAdminRoute>
                  <ExperiencesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/users"
              element={
                <ProtectedSuperAdminRoute>
                  <UsersPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/associations"
              element={
                <ProtectedSuperAdminRoute>
                  <AssociationsPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/cities"
              element={
                <ProtectedSuperAdminRoute>
                  <CitiesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/categories"
              element={
                <ProtectedSuperAdminRoute>
                  <CategoriesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/email-templates"
              element={
                <ProtectedSuperAdminRoute>
                  <EmailTemplatesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/access-codes"
              element={
                <ProtectedSuperAdminRoute>
                  <AccessCodesPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/access-requests"
              element={
                <ProtectedSuperAdminRoute>
                  <AccessRequestsPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/profile"
              element={
                <ProtectedSuperAdminRoute>
                  <SuperAdminProfile />
                </ProtectedSuperAdminRoute>
              }
            />
            {/* Association Admin Routes */}
            <Route
              path="/association"
              element={
                <ProtectedAssociationRoute>
                  <AssociationHome />
                </ProtectedAssociationRoute>
              }
            />
            <Route
              path="/association/experiences"
              element={
                <ProtectedAssociationRoute>
                  <AssociationExperiencesPage />
                </ProtectedAssociationRoute>
              }
            />
            <Route
              path="/association/history"
              element={
                <ProtectedAssociationRoute>
                  <AssociationHistoryPage />
                </ProtectedAssociationRoute>
              }
            />
            <Route
              path="/association/calendar"
              element={
                <ProtectedAssociationRoute>
                  <AssociationCalendarPage />
                </ProtectedAssociationRoute>
              }
            />
            <Route
              path="/association/profile"
              element={
                <ProtectedAssociationRoute>
                  <AssociationProfilePage />
                </ProtectedAssociationRoute>
              }
            />
            <Route
              path="/association/my-profile"
              element={
                <ProtectedAssociationRoute>
                  <AssociationAdminProfile />
                </ProtectedAssociationRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
