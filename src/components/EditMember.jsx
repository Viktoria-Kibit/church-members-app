import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate, useParams } from "react-router-dom"

export default function EditMember() {
    const { id } = useParams()
    const [formData, setFormData] = useState({
        last_name: "",
        first_name: "",
        middle_name: "",
        birth_date: "",
        baptism_date: "",
        phone: "",
        street: "",
        building: "",
        apartment: "",
        notes: "",
        status_id: "",
        ministry_type_id: "",
        home_group_id: "",
        deacon_id: ""
    })
    const [statuses, setStatuses] = useState([])
    const [ministryTypes, setMinistryTypes] = useState([])
    const [homeGroups, setHomeGroups] = useState([])
    const [deacons, setDeacons] = useState([])
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchData = async () => {
            const [memberRes, statusesRes, ministriesRes, groupsRes, deaconsRes] = await Promise.all([
                supabase.from("members").select("*").eq("id", id).single(),
                supabase.from("statuses").select("id, name"),
                supabase.from("ministry_types").select("id, name"),
                supabase.from("home_groups").select("id, name"),
                supabase.from("deacons").select("id, full_name")
            ])
            if (memberRes.error || statusesRes.error || ministriesRes.error || groupsRes.error || deaconsRes.error) {
                setError("Помилка завантаження даних")
                return
            }
            setFormData({
                last_name: memberRes.data.last_name,
                first_name: memberRes.data.first_name,
                middle_name: memberRes.data.middle_name || "",
                birth_date: memberRes.data.birth_date || "",
                baptism_date: memberRes.data.baptism_date || "",
                phone: memberRes.data.phone || "",
                street: memberRes.data.street || "",
                building: memberRes.data.building || "",
                apartment: memberRes.data.apartment || "",
                notes: memberRes.data.notes || "",
                status_id: memberRes.data.status_id || "",
                ministry_type_id: memberRes.data.ministry_type_id || "",
                home_group_id: memberRes.data.home_group_id || "",
                deacon_id: memberRes.data.deacon_id || ""
            })
            setStatuses(statusesRes.data)
            setMinistryTypes(ministriesRes.data)
            setHomeGroups(groupsRes.data)
            setDeacons(deaconsRes.data)
            setLoading(false)
        }
        fetchData()
    }, [id])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.from('members').update({
            ...formData,
            status_id: formData.status_id || null,
            ministry_type_id: formData.ministry_type_id || null,
            home_group_id: formData.home_group_id || null,
            deacon_id: formData.deacon_id || null
        }).eq('id', id)
        setLoading(false)
        if (error) {
            setError("Помилка редагування члена: " + error.message)
        } else {
            navigate('/members')
        }
    }

    if (loading) return <div className="p-6">Завантаження...</div>
    if (error) return <div className="p-6 text-red-500">{error}</div>

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-4 w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Редагувати члена</h1>
                <div>
                    <label className="block text-sm font-medium">Прізвище</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.last_name}
                        onChange={e => handleChange("last_name", e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Ім’я</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.first_name}
                        onChange={e => handleChange("first_name", e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">По батькові</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.middle_name}
                        onChange={e => handleChange("middle_name", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Дата народження</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={formData.birth_date}
                        onChange={e => handleChange("birth_date", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Дата хрещення</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        value={formData.baptism_date}
                        onChange={e => handleChange("baptism_date", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Телефон</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.phone}
                        onChange={e => handleChange("phone", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Вулиця</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.street}
                        onChange={e => handleChange("street", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Будинок</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.building}
                        onChange={e => handleChange("building", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Квартира</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={formData.apartment}
                        onChange={e => handleChange("apartment", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Примітки</label>
                    <textarea
                        className="w-full border rounded px-2 py-1"
                        value={formData.notes}
                        onChange={e => handleChange("notes", e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Статус</label>
                    <select
                        value={formData.status_id}
                        onChange={e => handleChange("status_id", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    >
                        <option value="">— Виберіть —</option>
                        {statuses.map(status => (
                            <option key={status.id} value={status.id}>{status.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Служіння</label>
                    <select
                        value={formData.ministry_type_id}
                        onChange={e => handleChange("ministry_type_id", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    >
                        <option value="">— Виберіть —</option>
                        {ministryTypes.map(ministry => (
                            <option key={ministry.id} value={ministry.id}>{ministry.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Група</label>
                    <select
                        value={formData.home_group_id}
                        onChange={e => handleChange("home_group_id", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    >
                        <option value="">— Виберіть —</option>
                        {homeGroups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Диякон</label>
                    <select
                        value={formData.deacon_id}
                        onChange={e => handleChange("deacon_id", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    >
                        <option value="">— Виберіть —</option>
                        {deacons.map(deacon => (
                            <option key={deacon.id} value={deacon.id}>{deacon.full_name}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    disabled={loading}
                >
                    Зберегти
                </button>
            </form>
        </div>
    )
}