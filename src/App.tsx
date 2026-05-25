import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedHRRoute } from "@/components/ProtectedHRRoute";
import { ProtectedSuperAdminRoute } from "@/components/ProtectedSuperAdminRoute";
import { ProtectedAssociationRoute } from "@/components/ProtectedAssociationRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Experiences from "./pages/Experiences";
import ExperienceDetail from "./pages/ExperienceDetail";
import MyBookings from "./pages/MyBookings";
import CompletedExperiences from "./pages/CompletedExperiences";
import Impact from "./pages/Impact";

import Profile from "./pages/Profile";
import EmployeeSettingsIndex from "./pages/EmployeeSettingsIndex";
import EmployeeSettingsPersonali from "./pages/settings/EmployeeSettingsPersonali";
import EmployeeSettingsSicurezza from "./pages/settings/EmployeeSettingsSicurezza";
import EmployeeSettingsNotifiche from "./pages/settings/EmployeeSettingsNotifiche";
import HRDashboard from "./pages/HRDashboard";
import HRHomePage from "./pages/hr/HRHomePage";
import HRExperiencesPage from "./pages/hr/HRExperiencesPage";
import HRExperienceDetail from "./pages/hr/HRExperienceDetail";
import HRTeamBuildingPage from "./pages/hr/HRTeamBuildingPage";
import HRNewTBRequestPage from "./pages/hr/HRNewTBRequestPage";
import HRTBRequestDetailPage from "./pages/hr/HRTBRequestDetailPage";
import HRTBProposalDetailPage from "./pages/hr/HRTBProposalDetailPage";
import HREmployeesPage from "./pages/hr/HREmployeesPage";
import HRCalendarPage from "./pages/hr/HRCalendarPage";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import CompaniesPage from "./pages/super-admin/CompaniesPage";
import ExperiencesPage from "./pages/super-admin/ExperiencesPage";

import UsersPage from "./pages/super-admin/UsersPage";
import AssociationsPage from "./pages/super-admin/AssociationsPage";
import CitiesPage from "./pages/super-admin/CitiesPage";
import CategoriesPage from "./pages/super-admin/CategoriesPage";
import EmailSettingsPage from "./pages/super-admin/EmailSettingsPage";
import AccessCodesPage from "./pages/super-admin/AccessCodesPage";
import AssociationHome from "./pages/association/AssociationHome";
import AssociationExperiencesPage from "./pages/association/AssociationExperiencesPage";
import AssociationExperienceDetail from "./pages/association/AssociationExperienceDetail";
import AssociationHistoryPage from "./pages/association/AssociationHistoryPage";
import AssociationProfilePage from "./pages/association/AssociationProfilePage";
import AssociationCalendarPage from "./pages/association/AssociationCalendarPage";
import HRSettingsLayout from "./components/layout/HRSettingsLayout";
import SuperAdminSettingsLayout from "./components/layout/SuperAdminSettingsLayout";
import AssociationSettingsLayout from "./components/layout/AssociationSettingsLayout";
import SettingsProfile from "./pages/hr/settings/SettingsProfile";
import HRSettingsSecurity from "./pages/hr/settings/SettingsSecurity";
import SettingsTheme from "./pages/hr/settings/SettingsTheme";
import SettingsGeneral from "./pages/hr/settings/SettingsGeneral";
import SettingsMembers from "./pages/hr/settings/SettingsMembers";
import SettingsVolunteering from "./pages/hr/settings/SettingsVolunteering";
import SettingsDisabled from "./pages/hr/settings/SettingsDisabled";
import SuperAdminSettingsProfile from "./pages/super-admin/settings/SettingsProfile";
import SuperAdminSettingsSecurity from "./pages/super-admin/settings/SettingsSecurity";
import AssociationSettingsProfile from "./pages/association/settings/SettingsProfile";
import AssociationSettingsSecurity from "./pages/association/settings/SettingsSecurity";
import AssociationSettingsOrganization from "./pages/association/settings/SettingsOrganization";
import AccessRequestsPage from "./pages/super-admin/AccessRequestsPage";
import TBFormatsPage from "./pages/super-admin/TBFormatsPage";
import TBFormatDetailPage from "./pages/super-admin/TBFormatDetailPage";
import TBRequestsPage from "./pages/super-admin/TBRequestsPage";
import TBRequestDetailPage from "./pages/super-admin/TBRequestDetailPage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import HRPlaceholderPage from "./pages/hr/HRPlaceholderPage";
import HRGalleryPage from "./pages/hr/HRGalleryPage";
import Unsubscribe from "./pages/Unsubscribe";
import PublicAssociationSuggestion from "./pages/PublicAssociationSuggestion";
import HRSuggestionsPage from "./pages/hr/HRSuggestionsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <MotionConfig reducedMotion="always">
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
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/suggerisci-ets/:token" element={<PublicAssociationSuggestion />} />
            <Route
              path="/app/experiences"
              element={
                <ProtectedRoute>
                  <Experiences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/experiences/:id"
              element={
                <ProtectedRoute>
                  <ExperienceDetail />
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
              path="/app/esperienze-completate"
              element={
                <ProtectedRoute>
                  <CompletedExperiences />
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
              path="/app/gallery"
              element={
                <ProtectedRoute>
                  <Gallery />
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
              path="/app/impostazioni"
              element={
                <ProtectedRoute>
                  <EmployeeSettingsIndex />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impostazioni/personali"
              element={
                <ProtectedRoute>
                  <EmployeeSettingsPersonali />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impostazioni/sicurezza"
              element={
                <ProtectedRoute>
                  <EmployeeSettingsSicurezza />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impostazioni/notifiche"
              element={
                <ProtectedRoute>
                  <EmployeeSettingsNotifiche />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr"
              element={
                <ProtectedHRRoute>
                  <HRHomePage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/report"
              element={
                <ProtectedHRRoute>
                  <HRDashboard />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/volontariato"
              element={
                <ProtectedHRRoute>
                  <HRExperiencesPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/experiences/:id"
              element={
                <ProtectedHRRoute>
                  <HRExperienceDetail />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/users"
              element={
                <ProtectedHRRoute>
                  <HREmployeesPage />
                </ProtectedHRRoute>
              }
            />
            <Route path="/hr/calendario" element={<ProtectedHRRoute><HRCalendarPage /></ProtectedHRRoute>} />
            <Route path="/hr/galleria" element={<ProtectedHRRoute><HRGalleryPage /></ProtectedHRRoute>} />
            <Route path="/hr/ets-suggeriti" element={<ProtectedHRRoute><HRSuggestionsPage /></ProtectedHRRoute>} />
            <Route path="/hr/comunicazione" element={<ProtectedHRRoute><HRPlaceholderPage title="Comunicazione" /></ProtectedHRRoute>} />
            <Route
              path="/hr/profile"
              element={<Navigate to="/hr/impostazioni/profilo" replace />}
            />
            <Route
              path="/hr/impostazioni"
              element={
                <ProtectedHRRoute>
                  <HRSettingsLayout />
                </ProtectedHRRoute>
              }
            >
              <Route index element={<Navigate to="profilo" replace />} />
              <Route path="profilo" element={<SettingsProfile />} />
              <Route path="sicurezza" element={<HRSettingsSecurity />} />
              <Route path="tema" element={<SettingsTheme />} />
              <Route path="notifiche" element={<SettingsDisabled />} />
              <Route path="referral" element={<SettingsDisabled />} />
              <Route path="generali" element={<SettingsGeneral />} />
              <Route path="membri" element={<SettingsMembers />} />
              <Route path="upgrade" element={<SettingsDisabled />} />
              <Route path="fatturazione" element={<SettingsDisabled />} />
              <Route path="volontariato" element={<SettingsVolunteering />} />
              <Route path="team-building" element={<SettingsDisabled />} />
            </Route>
            <Route
              path="/hr/team-building"
              element={
                <ProtectedHRRoute>
                  <HRTeamBuildingPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/team-building/nuova-richiesta"
              element={
                <ProtectedHRRoute>
                  <HRNewTBRequestPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/team-building/brief/:id"
              element={
                <ProtectedHRRoute>
                  <HRNewTBRequestPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/team-building/:id"
              element={
                <ProtectedHRRoute>
                  <HRTBRequestDetailPage />
                </ProtectedHRRoute>
              }
            />
            <Route
              path="/hr/team-building/:id/proposte/:proposalId"
              element={
                <ProtectedHRRoute>
                  <HRTBProposalDetailPage />
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
              path="/super-admin/email-settings"
              element={
                <ProtectedSuperAdminRoute>
                  <EmailSettingsPage />
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
              path="/super-admin/team-building/formats"
              element={
                <ProtectedSuperAdminRoute>
                  <TBFormatsPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/team-building/formats/:id"
              element={
                <ProtectedSuperAdminRoute>
                  <TBFormatDetailPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/team-building/richieste"
              element={
                <ProtectedSuperAdminRoute>
                  <TBRequestsPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/team-building/richieste/:id"
              element={
                <ProtectedSuperAdminRoute>
                  <TBRequestDetailPage />
                </ProtectedSuperAdminRoute>
              }
            />
            <Route
              path="/super-admin/profile"
              element={<Navigate to="/super-admin/impostazioni/profilo" replace />}
            />
            <Route
              path="/super-admin/impostazioni"
              element={
                <ProtectedSuperAdminRoute>
                  <SuperAdminSettingsLayout />
                </ProtectedSuperAdminRoute>
              }
            >
              <Route index element={<Navigate to="profilo" replace />} />
              <Route path="profilo" element={<SuperAdminSettingsProfile />} />
              <Route path="sicurezza" element={<SuperAdminSettingsSecurity />} />
            </Route>
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
              path="/association/experiences/:id"
              element={
                <ProtectedAssociationRoute>
                  <AssociationExperienceDetail />
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
            <Route path="/association/team-building" element={<ProtectedAssociationRoute><HRPlaceholderPage title="Team building sociali" /></ProtectedAssociationRoute>} />
            <Route path="/association/formazione" element={<ProtectedAssociationRoute><HRPlaceholderPage title="Formazione" /></ProtectedAssociationRoute>} />
            <Route path="/association/negozio" element={<ProtectedAssociationRoute><HRPlaceholderPage title="Negozio solidale" /></ProtectedAssociationRoute>} />
            <Route path="/association/convenzioni" element={<ProtectedAssociationRoute><HRPlaceholderPage title="Convenzioni" /></ProtectedAssociationRoute>} />
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
              element={<Navigate to="/association/impostazioni/profilo" replace />}
            />
            <Route
              path="/association/impostazioni"
              element={
                <ProtectedAssociationRoute>
                  <AssociationSettingsLayout />
                </ProtectedAssociationRoute>
              }
            >
              <Route index element={<Navigate to="profilo" replace />} />
              <Route path="profilo" element={<AssociationSettingsProfile />} />
              <Route path="sicurezza" element={<AssociationSettingsSecurity />} />
              <Route path="organizzazione" element={<AssociationSettingsOrganization />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </MotionConfig>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
