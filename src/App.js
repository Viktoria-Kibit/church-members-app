import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import MembersPage from './pages/MembersPage';
import AddMember from './components/AddMember';
import EditMember from './components/EditMember';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                    path="/members"
                    element={
                        <ProtectedRoute>
                            <MembersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/add-member"
                    element={
                        <ProtectedRoute requiredRole={['editor', 'superadmin']}>
                            <AddMember />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/edit-member/:id"
                    element={
                        <ProtectedRoute requiredRole={['editor', 'superadmin']}>
                            <EditMember />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requiredRole="superadmin">
                            <AdminPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<AuthPage />} />
            </Routes>
        </Router>
    );
}

export default App;