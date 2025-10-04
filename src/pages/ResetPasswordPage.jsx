import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "./AuthForm";

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleResetPassword = async ({ email }) => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            });
            if (error) throw new Error(error.message);
            showMessage("success", "Перевірте пошту для скидання пароля");
            navigate('/login');
        } catch (error) {
            console.error("Reset password error:", error);
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Скидання пароля</h2>
                <AuthForm
                    onSubmit={handleResetPassword}
                    buttonText="Скинути пароль"
                    loading={loading}
                    message={message}
                    showMessage={showMessage}
                />
                <div className="text-center">
                    <Link to="/login" className="text-blue-600 hover:underline text-sm">
                        Повернутися до входу
                    </Link>
                </div>
            </div>
        </div>
    );
}