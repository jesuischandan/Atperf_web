import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SubmitForm from './components/SubmitForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import StaffLogin from './components/StaffLogin';
import StaffRegister from './components/StaffRegister';
import StrapDiag from './components/StrapDiag';
import DecisionRadarLanding from './components/DecisionRadarLanding';
import StrapilotLanding from './components/StrapilotLanding';
import Strapilot from './components/Strapilot';
import DecisionRadar from './components/DecisionRadar';
import ContactPage from './components/ContactPage';
import UseCasesPage from './components/UseCasesPage';
import UseCaseDetailPage from './components/UseCaseDetailPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import DiscoverStrAP from './components/DiscoverStrAP';
import StrapSoftwareMaintenancePage from './components/maintenance/StrapSoftwareMaintenancePage';
import StrapMaintenanceDemo from './components/maintenance/StrapMaintenanceDemo';
import ToolsLayout from './components/layout/ToolsLayout';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/staff/login" element={<StaffLogin />} />
                <Route path="/staff/register" element={<StaffRegister />} />
                <Route path="/tool/strap-diagnosis" element={<StrapDiag />} />
                <Route path="/tool/decision-radar" element={<DecisionRadarLanding />} />
                <Route path="/tool/strapilot" element={<StrapilotLanding />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/use-cases" element={<UseCasesPage />} />
                <Route path="/use-cases/:id" element={<UseCaseDetailPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/discover" element={<DiscoverStrAP />} />
                <Route path="/strap-software" element={<Navigate to="/strap-software/maintenance" replace />} />
                <Route path="/strap-software/maintenance" element={<StrapSoftwareMaintenancePage />} />
                <Route path="/strap-software/maintenance/demo" element={<StrapMaintenanceDemo />} />
                {/* Logged-in StrAP tools share the sidebar shell */}
                <Route element={<ToolsLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/submit" element={<SubmitForm />} />
                    <Route path="/decision-radar" element={<DecisionRadar />} />
                    <Route path="/tool/strapilot/app" element={<Strapilot />} />
                    <Route path="/tool/strap-maintenance" element={<StrapMaintenanceDemo embedded />} />
                    <Route path="/admin" element={<AdminPanel />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;