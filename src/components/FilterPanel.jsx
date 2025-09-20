import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

export default function FilterPanel({ filters, setFilters }) {
    const [options, setOptions] = useState({
        statuses: [],
        ministries: [],
        groups: [],
        deacons: [],
        streets: []
    })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    // Current year for default max values
    const currentYear = new Date().getFullYear() // 2025 based on provided date

    useEffect(() => {
        // Set default max years if filters are empty
        setFilters(prev => ({
            ...prev,
            birth_to: prev.birth_to || currentYear,
            baptism_to: prev.baptism_to || currentYear
        }))

        const fetchOptions = async () => {
            try {
                setLoading(true)
                const [statusesRes, ministriesRes, groupsRes, deaconsRes, membersRes] = await Promise.all([
                    supabase.from("statuses").select("id, name").then(res => {
                        if (res.error) throw new Error(`Statuses error: ${res.error.message}`)
                        return res
                    }),
                    supabase.from("ministry_types").select("id, name").then(res => {
                        if (res.error) throw new Error(`Ministry types error: ${res.error.message}`)
                        return res
                    }),
                    supabase.from("home_groups").select("id, name").then(res => {
                        if (res.error) throw new Error(`Home groups error: ${res.error.message}`)
                        return res
                    }),
                    supabase.from("deacons").select("id, full_name").then(res => {
                        if (res.error) throw new Error(`Deacons error: ${res.error.message}`)
                        return res
                    }),
                    supabase.from("members").select("street").then(res => {
                        if (res.error) throw new Error(`Members error: ${res.error.message}`)
                        return res
                    })
                ])

                const uniqueStreets = [...new Set(
                    membersRes.data?.map(m => m.street).filter(Boolean) || []
                )]

                setOptions({
                    statuses: statusesRes.data || [],
                    ministries: ministriesRes.data || [],
                    groups: groupsRes.data || [],
                    deacons: deaconsRes.data || [],
                    streets: uniqueStreets || []
                })
            } catch (err) {
                console.error("Помилка при завантаженні опцій:", err.message)
                setError(`Не вдалося завантажити фільтри: ${err.message}`)
            } finally {
                setLoading(false)
            }
        }

        fetchOptions()
    }, [setFilters])

    const handleChange = (field, value) => {
        // Convert value to number for year fields and enforce constraints
        if (["birth_from", "birth_to", "baptism_from", "baptism_to"].includes(field)) {
            const numValue = value ? parseInt(value, 10) : ""
            if (numValue && (numValue < 1 || numValue > currentYear)) {
                return // Ignore invalid years
            }
            setFilters(prev => ({ ...prev, [field]: numValue || "" }))
        } else {
            setFilters(prev => ({ ...prev, [field]: value }))
        }
    }

    const handleClearFilters = () => {
        setFilters({
            birth_to: currentYear,
            baptism_to: currentYear
        })
    }

    if (loading) return <div className="bg-white shadow-md p-4 rounded-md w-[400px]">Завантаження фільтрів...</div>
    if (error) return <div className="bg-white shadow-md p-4 rounded-md text-red-500 w-[400px]">{error}</div>

    return (
        <div className="bg-white shadow-md p-4 rounded-md space-y-4 w-[400px]">
            {/* Вулиця */}
            <div>
                <label className="block text-sm font-medium">Вулиця</label>
                <input
                    type="text"
                    list="street-list"
                    className="w-full border rounded px-2 py-1"
                    value={filters.street || ""}
                    onChange={e => handleChange("street", e.target.value)}
                />
                <datalist id="street-list">
                    {options.streets.map(street => (
                        <option key={street} value={street} />
                    ))}
                </datalist>
            </div>

            {/* Роки народження */}
            <div className="flex gap-2">
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Нар. від</label>
                    <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={filters.birth_from || ""}
                        onChange={e => handleChange("birth_from", e.target.value)}
                        min="1"
                        max={currentYear}
                        placeholder="Рік"
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Нар. до</label>
                    <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={filters.birth_to || ""}
                        onChange={e => handleChange("birth_to", e.target.value)}
                        min="1"
                        max={currentYear}
                        placeholder={currentYear}
                    />
                </div>
            </div>

            {/* Роки хрещення */}
            <div className="flex gap-2">
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Хрещ. від</label>
                    <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={filters.baptism_from || ""}
                        onChange={e => handleChange("baptism_from", e.target.value)}
                        min="1"
                        max={currentYear}
                        placeholder="Рік"
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Хрещ. до</label>
                    <input
                        type="number"
                        className="w-full border rounded px-2 py-1"
                        value={filters.baptism_to || ""}
                        onChange={e => handleChange("baptism_to", e.target.value)}
                        min="1"
                        max={currentYear}
                        placeholder={currentYear}
                    />
                </div>
            </div>

            {/* Селектори */}
            <DropdownSelect
                label="Статус"
                value={filters.status_id}
                onChange={v => handleChange("status_id", v)}
                options={options.statuses}
            />
            <DropdownSelect
                label="Служіння"
                value={filters.ministry_type_id}
                onChange={v => handleChange("ministry_type_id", v)}
                options={options.ministries}
            />
            <DropdownSelect
                label="Група"
                value={filters.home_group_id}
                onChange={v => handleChange("home_group_id", v)}
                options={options.groups}
            />
            <DropdownSelect
                label="Диякон"
                value={filters.deacon_id}
                onChange={v => handleChange("deacon_id", v)}
                options={options.deacons.map(d => ({ id: d.id, name: d.full_name }))}
            />

            {/* Очистити фільтри */}
            <button
                onClick={handleClearFilters}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
                Очистити фільтри
            </button>
        </div>
    )
}

function DropdownSelect({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-sm font-medium">{label}</label>
            <select
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                className="w-full border rounded px-2 py-1"
            >
                <option value="">— Усі —</option>
                {options.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
            </select>
        </div>
    )
}