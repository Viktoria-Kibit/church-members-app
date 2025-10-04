import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { IoArrowBack } from "react-icons/io5";

// Схема валідації з yup
const schema = yup.object({
    last_name: yup.string().required("Прізвище обов’язкове").min(2, "Мінімум 2 символи"),
    first_name: yup.string().required("Ім’я обов’язкове").min(2, "Мінімум 2 символи"),
    middle_name: yup.string().optional(),
    birth_date: yup.date().optional().max(new Date(), "Дата народження не може бути в майбутньому"),
    baptism_date: yup.date().optional()
        .when("birth_date", (birth_date, schema) => {
            return birth_date ? schema.min(birth_date, "Дата хрещення не може бути раніше дати народження") : schema;
        }),
    phone: yup.string().optional().matches(/^\+?\d{10,12}$/, "Невірний формат телефону (наприклад, +380123456789)"),
    street: yup.string().optional(),
    building: yup.string().optional(),
    apartment: yup.string().optional(),
    notes: yup.string().optional().max(500, "Максимум 500 символів"),
    status_id: yup.string().optional(),
    ministry_type_id: yup.string().optional(),
    home_group_id: yup.string().optional(),
    deacon_id: yup.string().optional(),
}).required();

export default function AddMember() {
    const [statuses, setStatuses] = useState([]);
    const [ministryTypes, setMinistryTypes] = useState([]);
    const [homeGroups, setHomeGroups] = useState([]);
    const [deacons, setDeacons] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Використання react-hook-form з yup
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
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
            deacon_id: "",
        },
    });

    useEffect(() => {
        const fetchOptions = async () => {
            const [statusesRes, ministriesRes, groupsRes, deaconsRes] = await Promise.all([
                supabase.from("statuses").select("id, name"),
                supabase.from("ministry_types").select("id, name"),
                supabase.from("home_groups").select("id, name"),
                supabase.from("deacons").select("id, full_name"),
            ]);
            if (statusesRes.error || ministriesRes.error || groupsRes.error || deaconsRes.error) {
                setError("Помилка завантаження даних");
                return;
            }
            setStatuses(statusesRes.data);
            setMinistryTypes(ministriesRes.data);
            setHomeGroups(groupsRes.data);
            setDeacons(deaconsRes.data);
            setLoading(false);
        };
        fetchOptions();
    }, []);

    // Функція сабміту форми (з валідацією)
    const onSubmit = async (data) => {
        setLoading(true);
        const { error } = await supabase.from("members").insert({
            ...data,
            status_id: data.status_id || null,
            ministry_type_id: data.ministry_type_id || null,
            home_group_id: data.home_group_id || null,
            deacon_id: data.deacon_id || null,
        });
        setLoading(false);
        if (error) {
            setError("Помилка додавання члена: " + error.message);
        } else {
            navigate("/members");
        }
    };

    if (loading) return <div className="p-6 flex justify-center items-center">Завантаження...</div>;
    if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center p-6 relative">
            <button
                onClick={() => navigate("/members")}
                className="absolute top-6 left-6 text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 shadow-md"
                title="Назад до членів"
                disabled={loading}
                aria-label="Повернутися до сторінки членів"
            >
                <IoArrowBack size={24} />
            </button>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6 space-y-4 w-full max-w-lg">
                <h1 className="text-2xl font-bold text-center mb-6">Додати нового члена</h1>

                {/* Прізвище */}
                <div>
                    <label className="block text-sm font-medium">Прізвище</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("last_name")}
                    />
                    {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
                </div>

                {/* Ім’я */}
                <div>
                    <label className="block text-sm font-medium">Ім’я</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("first_name")}
                    />
                    {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
                </div>

                {/* По батькові */}
                <div>
                    <label className="block text-sm font-medium">По батькові</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("middle_name")}
                    />
                    {errors.middle_name && <p className="text-red-500 text-xs mt-1">{errors.middle_name.message}</p>}
                </div>

                {/* Дата народження */}
                <div>
                    <label className="block text-sm font-medium">Дата народження</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        {...register("birth_date")}
                    />
                    {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date.message}</p>}
                </div>

                {/* Дата хрещення */}
                <div>
                    <label className="block text-sm font-medium">Дата хрещення</label>
                    <input
                        type="date"
                        className="w-full border rounded px-2 py-1"
                        {...register("baptism_date")}
                    />
                    {errors.baptism_date && <p className="text-red-500 text-xs mt-1">{errors.baptism_date.message}</p>}
                </div>

                {/* Телефон */}
                <div>
                    <label className="block text-sm font-medium">Телефон</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("phone")}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                {/* Вулиця */}
                <div>
                    <label className="block text-sm font-medium">Вулиця</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("street")}
                    />
                    {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
                </div>

                {/* Будинок */}
                <div>
                    <label className="block text-sm font-medium">Будинок</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("building")}
                    />
                    {errors.building && <p className="text-red-500 text-xs mt-1">{errors.building.message}</p>}
                </div>

                {/* Квартира */}
                <div>
                    <label className="block text-sm font-medium">Квартира</label>
                    <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        {...register("apartment")}
                    />
                    {errors.apartment && <p className="text-red-500 text-xs mt-1">{errors.apartment.message}</p>}
                </div>

                {/* Примітки */}
                <div>
                    <label className="block text-sm font-medium">Примітки</label>
                    <textarea
                        className="w-full border rounded px-2 py-1"
                        {...register("notes")}
                    />
                    {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
                </div>

                {/* Селекти */}
                <div>
                    <label className="block text-sm font-medium">Статус</label>
                    <select {...register("status_id")} className="w-full border rounded px-2 py-1">
                        <option value="">— Виберіть —</option>
                        {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                                {status.name}
                            </option>
                        ))}
                    </select>
                    {errors.status_id && <p className="text-red-500 text-xs mt-1">{errors.status_id.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Служіння</label>
                    <select {...register("ministry_type_id")} className="w-full border rounded px-2 py-1">
                        <option value="">— Виберіть —</option>
                        {ministryTypes.map((ministry) => (
                            <option key={ministry.id} value={ministry.id}>
                                {ministry.name}
                            </option>
                        ))}
                    </select>
                    {errors.ministry_type_id && <p className="text-red-500 text-xs mt-1">{errors.ministry_type_id.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Домашня група</label>
                    <select {...register("home_group_id")} className="w-full border rounded px-2 py-1">
                        <option value="">— Виберіть —</option>
                        {homeGroups.map((homeGroup) => (
                            <option key={homeGroup.id} value={homeGroup.id}>
                                {homeGroup.name}
                            </option>
                        ))}
                    </select>
                    {errors.home_group_id && <p className="text-red-500 text-xs mt-1">{errors.home_group_id.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Диякон</label>
                    <select {...register("deacon_id")} className="w-full border rounded px-2 py-1">
                        <option value="">— Виберіть —</option>
                        {deacons.map((deacon) => (
                            <option key={deacon.id} value={deacon.id}>
                                {deacon.full_name}
                            </option>
                        ))}
                    </select>
                    {errors.deacon_id && <p className="text-red-500 text-xs mt-1">{errors.deacon_id.message}</p>}
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
                    disabled={loading}
                >
                    Додати
                </button>
            </form>
        </div>
    );
}