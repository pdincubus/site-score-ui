import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
    return (
        <AuthProvider>
            <AppShell>
                <Routes>
                    <Route path='/login' element={<LoginPage />} />
                    <Route
                        path='/dashboard'
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/projects'
                        element={
                            <ProtectedRoute>
                                <ProjectsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/clients'
                        element={
                            <ProtectedRoute>
                                <ClientsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/projects/:id'
                        element={
                            <ProtectedRoute>
                                <ProjectDetailPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path='/' element={<Navigate to='/dashboard' replace />} />
                    <Route path='*' element={<NotFoundPage />} />
                </Routes>
            </AppShell>
        </AuthProvider>
    );
}

export default App;
