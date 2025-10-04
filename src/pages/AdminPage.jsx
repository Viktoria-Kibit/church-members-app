import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { IoArrowBack } from "react-icons/io5"; // Імпорт іконки стрілки

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [newRole, setNewRole] = useState("");
    const [columnName, setColumnName] = useState("");
    const [columnType, setColumnType] = useState("text");
    const [logs, setLogs] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsersAndLogs = async () => {
            setLoading(true);
            try {
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("id, email, role");
                if (userError) throw new Error("Помилка завантаження користувачів: " + userError.message);
                setUsers(userData);

                const { data: logData } = await supabase
                    .from("audit_logs")
                    .select(`
        id,
        user_id,
        action,
        created_at,
        users!audit_logs_user_id_fkey(email)
    `)
                    .order("created_at", { ascending: false });
                setLogs(logData || []);
            } catch (err) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsersAndLogs();

        const subscription = supabase
            .channel('users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                fetchUsersAndLogs();
            })
            .subscribe();
        return () => supabase.removeChannel(subscription);
    }, []);

    const handleAssignRole = async () => {
        if (!selectedUserId || !newRole) {
            toast.error("Виберіть користувача та роль");
            return;
        }
        if (!["viewer", "editor", "superadmin"].includes(newRole)) {
            toast.error("Невалідна роль");
            return;
        }
        setLoading(true);
        const { error } = await supabase
            .from("users")
            .update({ role: newRole })
            .eq("id", selectedUserId);
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("audit_logs").insert({
                user_id: user.id,
                action: `Призначено роль ${newRole} для користувача ${selectedUserId}`,
            });
            const { data } = await supabase.from("users").select("id, email, role");
            setUsers(data);
        }
        setLoading(false);
        if (error) {
            toast.error("Помилка призначення ролі: " + error.message);
        } else {
            toast.success("Роль призначено успішно");
            setSelectedUserId("");
            setNewRole("");
        }
    };

    const handleAddColumn = async () => {
        if (!columnName || !columnType) {
            toast.error("Введіть назву стовпця та тип");
            return;
        }
        if (!columnName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
            toast.error("Назва стовпця може містити лише літери, цифри та підкреслення");
            return;
        }
        const sql = `ALTER TABLE members ADD COLUMN ${columnName} ${columnType};`;
        setLoading(true);
        const { data, error } = await supabase.functions.invoke("execute-ddl", {
            body: { sql },
        });
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from("audit_logs").insert({
                user_id: user.id,
                action: `Додано стовпець ${columnName} типу ${columnType} до таблиці members`,
            });
            const { data: logData } = await supabase
                .from("audit_logs")
                .select("id, user_id, action, created_at")
                .order("created_at", { ascending: false });
            setLogs(logData);
        }
        setLoading(false);
        if (error) {
            toast.error("Помилка додавання стовпця: " + error.message);
        } else {
            toast.success("Стовпець додано успішно");
            setColumnName("");
            setColumnType("text");
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Виберіть файл");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Файл занадто великий (макс. 5 МБ)");
            return;
        }
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                if (jsonData.length === 0) {
                    toast.error("Файл порожній");
                    setLoading(false);
                    return;
                }

                const requiredFields = ["Прізвище", "Ім’я"];
                const headers = Object.keys(jsonData[0]);
                if (!requiredFields.every((field) => headers.includes(field))) {
                    toast.error("Файл повинен містити колонки: Прізвище, Ім’я");
                    setLoading(false);
                    return;
                }

                const getIdFromName = async (table, nameColumn, value, idColumn = "id") => {
                    const { data, error } = await supabase
                        .from(table)
                        .select(idColumn)
                        .eq(nameColumn, value)
                        .single();
                    if (error || !data) return null;
                    return data[idColumn];
                };

                const mappedData = await Promise.all(
                    jsonData.map(async (row) => ({
                        last_name: row["Прізвище"] || null,
                        first_name: row["Ім’я"] || null,
                        middle_name: row["По батькові"] || null,
                        birth_date: row["Дата народження"] || null,
                        baptism_date: row["Дата хрещення"] || null,
                        phone: row["Телефон"] && /^\+?\d{10,12}$/.test(row["Телефон"]) ? row["Телефон"] : null,
                        street: row["Вулиця"] || null,
                        building: row["Будинок"] || null,
                        apartment: row["Квартира"] || null,
                        notes: row["Примітки"] || null,
                        status_id: await getIdFromName("statuses", "name", row["Статус"]),
                        ministry_type_id: await getIdFromName("ministry_types", "name", row["Служіння"]),
                        home_group_id: await getIdFromName("home_groups", "name", row["Домашня група"]),
                        deacon_id: await getIdFromName("deacons", "full_name", row["Диякон"]),
                    }))
                );

                const validData = mappedData.filter(
                    (row) => row.last_name && row.first_name
                );
                if (validData.length === 0) {
                    toast.error("Немає валідних даних для імпорту");
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.from("members").insert(validData);
                if (!error) {
                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from("audit_logs").insert({
                        user_id: user.id,
                        action: `Імпортовано ${validData.length} записів з Excel`,
                    });
                    const { data: logData } = await supabase
                        .from("audit_logs")
                        .select("id, user_id, action, created_at")
                        .order("created_at", { ascending: false });
                    setLogs(logData);
                }
                setLoading(false);
                if (error) {
                    toast.error("Помилка імпорту: " + error.message);
                } else {
                    toast.success(`Імпортовано ${validData.length} записів`);
                    setFile(null);
                }
            } catch (err) {
                setLoading(false);
                toast.error("Помилка обробки файлу: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    if (loading) return <div className="p-6 flex justify-center items-center">Завантаження...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-5xl relative">
                {/* Іконка стрілки назад */}
                <button
                    onClick={() => navigate("/members")}
                    className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
                    title="Назад до членів"
                    disabled={loading}
                >
                    <IoArrowBack size={24} />
                </button>
                <h1 className="text-2xl font-bold text-center mb-6">Адміністративна панель</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Ліва колонка: Призначення ролей та Додавання стовпців */}
                    <div className="space-y-8">
                        {/* Призначення ролей */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Призначення ролей</h2>
                            <div className="space-y-4">
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                    disabled={loading}
                                >
                                    <option value="">— Виберіть користувача —</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.email} ({user.role})
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                    disabled={loading}
                                >
                                    <option value="">— Виберіть роль —</option>
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="superadmin">Superadmin</option>
                                </select>
                                <button
                                    onClick={handleAssignRole}
                                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                                    disabled={loading}
                                >
                                    Призначити роль
                                </button>
                            </div>
                        </section>

                        {/* Додавання стовпців */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Додавання стовпців до таблиці members</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={columnName}
                                    onChange={(e) => setColumnName(e.target.value)}
                                    placeholder="Назва стовпця (наприклад, new_column)"
                                    className="w-full border rounded px-2 py-1"
                                    disabled={loading}
                                />
                                <select
                                    value={columnType}
                                    onChange={(e) => setColumnType(e.target.value)}
                                    className="w-full border rounded px-2 py-1"
                                    disabled={loading}
                                >
                                    <option value="text">TEXT</option>
                                    <option value="date">DATE</option>
                                    <option value="integer">INTEGER</option>
                                    <option value="boolean">BOOLEAN</option>
                                </select>
                                <button
                                    onClick={handleAddColumn}
                                    className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
                                    disabled={loading}
                                >
                                    Додати стовпець
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Права колонка: Історія змін та Імпорт Excel */}
                    <div className="space-y-8">
                        {/* Історія змін */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Історія змін</h2>
                            <div className="overflow-x-auto max-h-96">
                                <table className="w-full border-collapse">
                                    <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border px-4 py-2">Користувач</th>
                                        <th className="border px-4 py-2">Дія</th>
                                        <th className="border px-4 py-2">Дата</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="border px-4 py-2">{log.user_id}</td>
                                            <td className="border px-4 py-2">{log.action}</td>
                                            <td className="border px-4 py-2">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Імпорт Excel */}
                        <section>
                            <h2 className="text-xl font-semibold mb-4">Імпорт даних із Excel</h2>
                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="w-full border rounded px-2 py-1"
                                    disabled={loading}
                                />
                                <button
                                    onClick={handleUpload}
                                    className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:bg-purple-300"
                                    disabled={loading}
                                >
                                    Завантажити
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}