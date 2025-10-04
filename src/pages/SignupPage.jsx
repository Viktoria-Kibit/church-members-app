import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "./AuthForm";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSignUp = async ({ email, password }) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                if (error.message.includes("already registered")) {
                    throw new Error("Цей email уже зареєстровано. Спробуйте увійти.");
                }
                throw new Error(error.message);
            }
            console.log("Sign-up success:", data);
            showMessage("success", "Перевірте пошту для підтвердження реєстрації.");
            navigate('/login');
        } catch (error) {
            console.error("Sign-up error:", error);
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Реєстрація</h2>
                <AuthForm
                    onSubmit={handleSignUp}
                    buttonText="Зареєструватись"
                    loading={loading}
                    message={message}
                    showMessage={showMessage}
                    extraFields={["confirmPassword"]}
                />
                <div className="text-center">
                    <Link to="/login" className="text-blue-600 hover:underline text-sm">
                        Вже маєте акаунт? Увійдіть
                    </Link>
                </div>
            </div>
        </div>
    );
}