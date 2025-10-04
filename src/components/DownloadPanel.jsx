import { useState } from "react";
import * as XLSX from "xlsx";

export default function DownloadPanel({ members, keepPanelOpen }) {
    const [selectedColumns, setSelectedColumns] = useState({
        last_name: true,
        first_name: true,
        middle_name: true,
        birth_date: true,
        baptism_date: true,
        status: true,
        phone: true,
        street: true,
        building: true,
        apartment: true,
        ministry_type: true,
        home_group: true,
        deacon: true,
        notes: true
    });
    const [fileFormat, setFileFormat] = useState("csv");
    const [error, setError] = useState(null);

    const columnLabels = {
        last_name: "Прізвище",
        first_name: "Ім’я",
        middle_name: "По батькові",
        birth_date: "Дата народж.",
        baptism_date: "Дата хрещення",
        status: "Статус",
        phone: "Телефон",
        street: "Вулиця",
        building: "Будинок",
        apartment: "Квартира",
        ministry_type: "Служіння",
        home_group: "Група",
        deacon: "Диякон",
        notes: "Примітки"
    };

    const handleColumnToggle = (column) => {
        setSelectedColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
        setError(null);
        keepPanelOpen(); // Скинути таймер при взаємодії
    };

    const handleFormatChange = (e) => {
        setFileFormat(e.target.value);
        setError(null);
        keepPanelOpen(); // Скинути таймер при зміні формату
    };

    const handleDownload = () => {
        try {
            if (!members || members.length === 0) {
                setError("Немає даних для завантаження");
                return;
            }
            const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
            if (selectedCount === 0) {
                setError("Виберіть хоча б один стовпець");
                return;
            }

            const selectedData = members.map(member => {
                const row = {};
                if (selectedColumns.last_name) row["Прізвище"] = member.last_name || "-";
                if (selectedColumns.first_name) row["Ім’я"] = member.first_name || "-";
                if (selectedColumns.middle_name) row["По батькові"] = member.middle_name || "-";
                if (selectedColumns.birth_date) row["Дата народж."] = member.birth_date || "-";
                if (selectedColumns.baptism_date) row["Дата хрещення"] = member.baptism_date || "-";
                if (selectedColumns.status) row["Статус"] = member.statuses?.name || "-";
                if (selectedColumns.phone) row["Телефон"] = member.phone || "-";
                if (selectedColumns.street) row["Вулиця"] = member.street || "-";
                if (selectedColumns.building) row["Будинок"] = member.building || "-";
                if (selectedColumns.apartment) row["Квартира"] = member.apartment || "-";
                if (selectedColumns.ministry_type) row["Служіння"] = member.ministry_types?.name || "-";
                if (selectedColumns.home_group) row["Група"] = member.home_groups?.name || "-";
                if (selectedColumns.deacon) row["Диякон"] = member.deacons?.full_name || "-";
                if (selectedColumns.notes) row["Примітки"] = member.notes || "-";
                return row;
            });

            let content, mimeType, fileExtension;
            const fileName = `members_export_${new Date().toISOString().split('T')[0]}`;

            if (fileFormat === "csv") {
                const delimiter = ";";
                const headers = Object.keys(selectedData[0]).join(delimiter);
                const rows = selectedData.map(row =>
                    Object.values(row)
                        .map(val => `"${(val || "").toString().replace(/"/g, '""')}"`)
                        .join(delimiter)
                ).join("\n");
                content = `\uFEFF${headers}\n${rows}`;
                mimeType = "text/csv;charset=utf-8";
                fileExtension = "csv";
            } else if (fileFormat === "excel") {
                const ws = XLSX.utils.json_to_sheet(selectedData);
                ws['!cols'] = Object.keys(selectedData[0]).map(() => ({ wch: 15 }));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Члени церкви");
                content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileExtension = "xlsx";
            } else {
                content = JSON.stringify(selectedData, null, 2);
                mimeType = "application/json";
                fileExtension = "json";
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.${fileExtension}`;
            a.click();
            URL.revokeObjectURL(url);
            setError(null);
        } catch (err) {
            console.error("Помилка при завантаженні файлу:", err.message);
            setError("Не вдалося завантажити файл. Спробуйте ще раз.");
        }
    };

    const handlePrint = () => {
        try {
            if (!members || members.length === 0) {
                setError("Немає даних для друку");
                return;
            }
            const selectedCount = Object.values(selectedColumns).filter(Boolean).length;
            if (selectedCount === 0) {
                setError("Виберіть хоча б один стовпець");
                return;
            }

            const selectedData = members.map(member => {
                const row = {};
                if (selectedColumns.last_name) row["Прізвище"] = member.last_name || "-";
                if (selectedColumns.first_name) row["Ім’я"] = member.first_name || "-";
                if (selectedColumns.middle_name) row["По батькові"] = member.middle_name || "-";
                if (selectedColumns.birth_date) row["Дата народж."] = member.birth_date || "-";
                if (selectedColumns.baptism_date) row["Дата хрещення"] = member.baptism_date || "-";
                if (selectedColumns.status) row["Статус"] = member.statuses?.name || "-";
                if (selectedColumns.phone) row["Телефон"] = member.phone || "-";
                if (selectedColumns.street) row["Вулиця"] = member.street || "-";
                if (selectedColumns.building) row["Будинок"] = member.building || "-";
                if (selectedColumns.apartment) row["Квартира"] = member.apartment || "-";
                if (selectedColumns.ministry_type) row["Служіння"] = member.ministry_types?.name || "-";
                if (selectedColumns.home_group) row["Група"] = member.home_groups?.name || "-";
                if (selectedColumns.deacon) row["Диякон"] = member.deacons?.full_name || "-";
                if (selectedColumns.notes) row["Примітки"] = member.notes || "-";
                return row;
            });

            const headers = Object.keys(selectedData[0]).map(header => `<th class="border px-4 py-2">${header}</th>`).join("");
            const rows = selectedData.map(row =>
                `<tr>${Object.values(row).map(val => `<td className="border px-4 py-2">${val}</td>`).join("")}</tr>`
            ).join("");

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                setError("Не вдалося відкрити вікно для друку. Перевірте налаштування браузера.");
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Друк членів церкви</title>
                        <style>
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid black; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            @media print {
                                body { margin: 0; }
                                h1 { text-align: center; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Члени церкви</h1>
                        <table>
                            <thead><tr>${headers}</tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <script>
                            window.print();
                            setTimeout(() => window.close(), 100);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setError(null);
        } catch (err) {
            console.error("Помилка при друці:", err.message);
            setError("Не вдалося підготувати дані для друку. Спробуйте ще раз.");
        }
    };

    const isActionDisabled = !members || members.length === 0 || Object.values(selectedColumns).every(val => !val);

    return (
        <div className="bg-white shadow-md p-4 rounded-lg space-y-4 w-[400px]" onMouseEnter={keepPanelOpen}>
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            <h3 className="text-sm font-medium">Виберіть стовпці для експорту</h3>
            <div className="grid grid-cols-2 gap-2">
                {Object.keys(columnLabels).map(column => (
                    <label key={column} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={selectedColumns[column]}
                            onChange={() => handleColumnToggle(column)}
                            className="h-4 w-4"
                        />
                        <span className="text-sm">{columnLabels[column]}</span>
                    </label>
                ))}
            </div>
            <div>
                <label className="block text-sm font-medium">Формат файлу</label>
                <select
                    value={fileFormat}
                    onChange={handleFormatChange}
                    className="w-full border rounded px-2 py-1"
                >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="excel">Excel</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleDownload}
                    disabled={isActionDisabled}
                    className={`flex-1 px-4 py-2 rounded-md text-white ${
                        isActionDisabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                >
                    Завантажити
                </button>
                <button
                    onClick={handlePrint}
                    disabled={isActionDisabled}
                    className={`flex-1 px-4 py-2 rounded-md text-white ${
                        isActionDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"
                    }`}
                >
                    Друк
                </button>
            </div>
        </div>
    );
}