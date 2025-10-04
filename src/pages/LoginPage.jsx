import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import AuthForm from "./AuthForm";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSignIn = async ({ email, password }) => {
        setLoading(true);
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    throw new Error("Неправильний email або пароль");
                }
                throw new Error(error.message);
            }
            if (!user) throw new Error("Користувач не знайдений");

            const { data: role, error: roleError } = await supabase.rpc('get_user_role');
            if (roleError) throw new Error("Помилка отримання ролі: " + roleError.message);
            if (!role) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({ id: user.id, email: user.email, role: 'viewer' });
                if (insertError) throw new Error("Помилка додавання користувача: " + insertError.message);
                navigate('/members');
                return;
            }

            if (role === 'superadmin') {
                navigate('/admin');
            } else {
                navigate('/members');
            }
        } catch (error) {
            console.error("Помилка входу:", error);
            showMessage("error", error.message);
            await supabase.auth.signOut();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-6">
                <h2 className="text-2xl font-bold text-center">Вхід</h2>
                <AuthForm
                    onSubmit={handleSignIn}
                    buttonText="Увійти"
                    loading={loading}
                    message={message}
                    showMessage={showMessage}
                />
                <div className="text-center">
                    <Link to="/signup" className="text-blue-600 hover:underline text-sm">
                        Немає акаунта? Зареєструйтесь
                    </Link>
                    <br />
                    {/*<Link to="/reset-password" className="text-blue-600 hover:underline text-sm">*/}
                    {/*    Забули пароль?*/}
                    {/*</Link>*/}
                </div>
            </div>
        </div>
    );
}