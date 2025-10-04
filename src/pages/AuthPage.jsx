import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: "error" | "success", text: string }
    const navigate = useNavigate();

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw new Error(error.message);
            console.log("Sign-up success:", data);
            showMessage("success", "Перевірте пошту для підтвердження реєстрації.");
        } catch (error) {
            console.error("Sign-up error:", error);
            showMessage("error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw new Error(error.message);
            if (!user) throw new Error("Користувач не знайдений");

            // Використовуємо функцію get_user_role
            const { data: role, error: roleError } = await supabase.rpc('get_user_role');
            if (roleError) throw new Error("Помилка отримання ролі: " + roleError.message);
            if (!role) {
                // Якщо роль не знайдена, додаємо користувача до таблиці users
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
                <h2 className="text-2xl font-bold text-center">Вхід / Реєстрація</h2>

                {message && (
                    <div
                        className={`text-sm p-3 rounded-md transition-all ${
                            message.type === "error"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-green-100 text-green-700 border border-green-300"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Пароль
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ваш пароль"
                    />
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={handleSignIn}
                        disabled={loading}
                        className="w-1/2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        Увійти
                    </button>
                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="w-1/2 border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 transition disabled:opacity-50"
                    >
                        Зареєструватись
                    </button>
                </div>
            </div>
        </div>
    );
}