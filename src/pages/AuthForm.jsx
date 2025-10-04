import { useState } from "react";

export default function AuthForm({ onSubmit, buttonText, loading, message, showMessage, extraFields = [] }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // Для реєстрації

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showMessage("error", "Введіть коректну електронну пошту");
            return;
        }
        if (password.length < 6) {
            showMessage("error", "Пароль має містити щонайменше 6 символів");
            return;
        }
        if (extraFields.includes("confirmPassword") && password !== confirmPassword) {
            showMessage("error", "Паролі не збігаються");
            return;
        }
        onSubmit({ email, password });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    disabled={loading}
                    autoFocus
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
                    disabled={loading}
                />
            </div>

            {extraFields.includes("confirmPassword") && (
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Підтвердження пароля
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Повторіть пароль"
                        disabled={loading}
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50 relative"
            >
                {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" />
                        </svg>
                        Завантаження...
                    </span>
                ) : (
                    buttonText
                )}
            </button>
        </form>
    );
}