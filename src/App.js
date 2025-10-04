import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MembersPage from './pages/MembersPage';
import AddMember from './components/AddMember';
import EditMember from './components/EditMember';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import {ToastContainer} from "react-toastify";
import AuthForm from "./pages/AuthForm";

function App() {
    return (
        <Router>
            <div>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />

            <Routes>

                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
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
                <Route path="*" element={<LoginPage />} />
            </Routes>
            </div>
        </Router>
    );
}

export default App;