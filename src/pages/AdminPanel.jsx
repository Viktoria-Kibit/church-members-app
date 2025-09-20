import { useState, useEffect } from "react";
import { supabase, supabaseUrl } from "../supabaseClient"; // Import supabaseUrl
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

export default function AdminPanel() {
    const [sqlQuery, setSqlQuery] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [file, setFile] = useState(null); // For Excel file
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                navigate("/auth");
                return;
            }
            const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();
            if (profileError || profile.role !== "superadmin") {
                navigate("/members");
                return;
            }
            setRole(profile.role);
            setLoading(false);
        };
        checkRole();
    }, [navigate]);

    const handleExecuteDDL = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${supabaseUrl}/functions/v1/execute-ddl`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sql: sqlQuery }),
        });
        setLoading(false);
        if (!response.ok) {
            const { error } = await response.json();
            setError(`Помилка виконання запиту: ${error}`);
            return;
        }
        setSuccess("Запит виконано успішно");
        setSqlQuery("");
    };

    const getIdFromName = async (table, nameColumn, value, idColumn = "id") => {
        const { data, error } = await supabase
            .from(table)
            .select(idColumn)
            .eq(nameColumn, value)
            .single();
        if (error || !data) {
            console.warn(`No ${table} found for ${nameColumn}: ${value}`);
            return null; // Return null for invalid mappings
        }
        return data[idColumn];
    };

    const convertExcelToCsvWithMapping = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length < 1 || !jsonData[0].length) {
                        reject(new Error("Empty or invalid Excel file"));
                        return;
                    }

                    const headers = jsonData[0].map((h) => h.toLowerCase());
                    const rows = jsonData.slice(1);
                    const mappedRows = [];

                    // Define mapping of header names to table lookups
                    const mappings = {
                        deacon: { table: "deacons", column: "name", idColumn: "id" },
                        status: { table: "statuses", column: "name", idColumn: "id" },
                        ministry_type: { table: "ministry_types", column: "name", idColumn: "id" },
                        home_group: { table: "home_groups", column: "name", idColumn: "id" },
                    };

                    for (const row of rows) {
                        const mappedRow = {};
                        for (let i = 0; i < headers.length; i++) {
                            const header = headers[i];
                            let value = row[i] !== undefined ? row[i].toString().trim() : "";

                            // Map foreign key fields by name
                            if (mappings[header]) {
                                const mappedId = await getIdFromName(
                                    mappings[header].table,
                                    mappings[header].column,
                                    value,
                                    mappings[header].idColumn
                                );
                                mappedRow[header] = mappedId || null; // Use null if no match
                            } else {
                                mappedRow[header] = value || null; // Direct value for non-mapped fields
                            }
                        }
                        mappedRows.push(mappedRow);
                    }

                    // Convert to CSV format
                    const csvHeaders = headers.join(",");
                    const csvRows = mappedRows.map((row) =>
                        headers
                            .map((header) => (row[header] !== undefined ? `"${row[header]}"` : ""))
                            .join(",")
                    );
                    const csvData = [csvHeaders, ...csvRows].join("\n");
                    resolve(csvData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (e) => reject(new Error("Error reading file"));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setUploadError("Будь ласка, виберіть файл");
            return;
        }

        setLoading(true);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            let csvData;
            if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
                csvData = await convertExcelToCsvWithMapping(file);
            } else {
                throw new Error("Unsupported file format. Use .xlsx or .xls");
            }

            const { data: { session } } = await supabase.auth.getSession();
            console.log("Session:", session); // Debug
            console.log("Fetching:", `${supabaseUrl}/functions/v1/import-csv`); // Debug
            const response = await fetch(`${supabaseUrl}/functions/v1/import-csv`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ csv: csvData }),
            });
            console.log("Response:", response); // Debug
            const result = await response.json();
            console.log("Result:", result); // Debug
            if (response.status === 200) {
                setUploadSuccess(`Успішно імпортовано ${result.processed} записів`);
                setFile(null);
            } else {
                setUploadError(`Помилка: ${result.error}`);
            }
        } catch (err) {
            console.error("Upload error:", err); // Debug
            setUploadError(`Помилка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6 flex justify-center items-center">Завантаження...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center p-6">
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Адмін-панель</h1>

                {/* SQL Execution Section */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-lg font-medium text-center">Виконати SQL-запит (DDL)</h2>
                    <p className="text-sm text-gray-600 text-center">Тільки для створення/зміни таблиць або колонок</p>
                    {success && <div className="text-green-500 text-sm text-center">{success}</div>}
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <textarea
                        className="w-full border rounded px-2 py-1 h-32"
                        value={sqlQuery}
                        onChange={(e) => setSqlQuery(e.target.value)}
                        placeholder="CREATE TABLE new_table (id UUID PRIMARY KEY, name TEXT);"
                    />
                    <button
                        onClick={handleExecuteDDL}
                        className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                        disabled={loading || !sqlQuery}
                    >
                        Виконати
                    </button>
                </div>

                {/* File Upload Section */}
                <form onSubmit={handleUpload} className="space-y-4">
                    <h2 className="text-lg font-medium text-center">Імпорт файлу</h2>
                    <div>
                        <label className="block text-sm font-medium text-center">
                            Виберіть Excel файл (XLSX, XLS)
                        </label>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            className="w-full border rounded px-2 py-1"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                    {uploadError && <div className="text-red-500 text-center">{uploadError}</div>}
                    {uploadSuccess && <div className="text-green-500 text-center">{uploadSuccess}</div>}
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                        disabled={loading || !file}
                    >
                        Завантажити
                    </button>
                </form>

                <button
                    onClick={() => navigate("/members")}
                    className="w-full mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                    Назад до членів
                </button>
            </div>
        </div>
    );
}