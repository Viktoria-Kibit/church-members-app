import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "use-debounce";
import FilterPanel from "../components/FilterPanel";
import DownloadPanel from "../components/DownloadPanel";

export default function MembersPage() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [showDownload, setShowDownload] = useState(false);
    const filterTimeoutRef = useRef(null);
    const downloadTimeoutRef = useRef(null);

    const [debouncedFilters] = useDebounce(filters, 500);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                navigate("/auth");
                return;
            }
            setUser(user);

            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profileError) {
                console.error("Error fetching role:", profileError);
                navigate("/auth");
                return;
            }
            setRole(profile.role);

            let query = supabase
                .from("members")
                .select(`
                    id,
                    last_name,
                    first_name,
                    middle_name,
                    birth_date,
                    baptism_date,
                    phone,
                    street,
                    building,
                    apartment,
                    notes,
                    statuses(name),
                    ministry_types(name),
                    home_groups(name),
                    deacons(full_name)
                `)
                .order("last_name", { ascending: true });

            if (debouncedFilters.street) query = query.ilike("street", `%${debouncedFilters.street}%`);
            if (debouncedFilters.birth_from) query = query.gte("birth_date", `${debouncedFilters.birth_from}-01-01`);
            if (debouncedFilters.birth_to) query = query.lte("birth_date", `${debouncedFilters.birth_to}-12-31`);
            if (debouncedFilters.baptism_from) query = query.gte("baptism_date", `${debouncedFilters.baptism_from}-01-01`);
            if (debouncedFilters.baptism_to) query = query.lte("baptism_date", `${debouncedFilters.baptism_to}-12-31`);
            if (debouncedFilters.status_id) query = query.eq("status_id", debouncedFilters.status_id);
            if (debouncedFilters.ministry_type_id) query = query.eq("ministry_type_id", debouncedFilters.ministry_type_id);
            if (debouncedFilters.home_group_id) query = query.eq("home_group_id", debouncedFilters.home_group_id);
            if (debouncedFilters.deacon_id) query = query.eq("deacon_id", debouncedFilters.deacon_id);

            const { data, error } = await query;
            if (error) {
                console.error("Помилка при завантаженні членів:", error.message);
            } else {
                setMembers(data);
            }
            setLoading(false);
        };
        fetchData();
    }, [navigate, debouncedFilters]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const handleAddMember = async (newMember) => {
        const { error } = await supabase.from('members').insert(newMember);
        if (error) {
            console.error("Error adding member:", error);
            return false;
        }
        const { data } = await supabase.from('members').select(`
            id,
            last_name,
            first_name,
            middle_name,
            birth_date,
            baptism_date,
            phone,
            street,
            building,
            apartment,
            notes,
            statuses(name),
            ministry_types(name),
            home_groups(name),
            deacons(full_name)
        `).order('last_name', { ascending: true });
        setMembers(data);
        return true;
    };

    const handleEditMember = async (id, updatedData) => {
        const { error } = await supabase.from('members').update(updatedData).eq('id', id);
        if (error) {
            console.error("Error updating member:", error);
            return false;
        }
        const { data } = await supabase.from('members').select(`
            id,
            last_name,
            first_name,
            middle_name,
            birth_date,
            baptism_date,
            phone,
            street,
            building,
            apartment,
            notes,
            statuses(name),
            ministry_types(name),
            home_groups(name),
            deacons(full_name)
        `).order('last_name', { ascending: true });
        setMembers(data);
        return true;
    };

    const handleDeleteMember = async (id) => {
        setMemberToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        const { error } = await supabase.from('members').delete().eq('id', memberToDelete);
        if (error) {
            console.error("Error deleting member:", error);
            setShowDeleteModal(false);
            setMemberToDelete(null);
            return false;
        }
        setMembers(members.filter(member => member.id !== memberToDelete));
        setShowDeleteModal(false);
        setMemberToDelete(null);
        return true;
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMemberToDelete(null);
    };

    const handleFilterMouseEnter = () => {
        clearTimeout(filterTimeoutRef.current);
        setShowFilters(true);
        setShowDownload(false);
        clearTimeout(downloadTimeoutRef.current);
    };

    const handleFilterMouseLeave = () => {
        filterTimeoutRef.current = setTimeout(() => {
            setShowFilters(false);
        }, 2000);
    };

    const handleDownloadMouseEnter = () => {
        clearTimeout(downloadTimeoutRef.current);
        setShowDownload(true);
        setShowFilters(false);
        clearTimeout(filterTimeoutRef.current);
    };

    const handleDownloadMouseLeave = () => {
        downloadTimeoutRef.current = setTimeout(() => {
            setShowDownload(false);
        }, 2000);
    };

    const keepDownloadPanelOpen = () => {
        clearTimeout(downloadTimeoutRef.current);
        setShowDownload(true);
    };

    const handleFilterClick = () => {
        setShowFilters(p => !p);
        setShowDownload(false);
        clearTimeout(downloadTimeoutRef.current);
    };

    const handleDownloadClick = () => {
        setShowDownload(p => !p);
        setShowFilters(false);
        clearTimeout(filterTimeoutRef.current);
    };

    if (loading) {
        return <div className="p-6">Завантаження...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Члени церкви</h1>
                <div className="relative flex gap-2">
                    <div
                        className="relative"
                        onMouseEnter={handleFilterMouseEnter}
                        onMouseLeave={handleFilterMouseLeave}
                    >
                        <button
                            onClick={handleFilterClick}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                            Фільтри
                        </button>
                        {showFilters && (
                            <div
                                className="absolute right-0 mt-2 z-20 w-[400px] rounded-md shadow-lg"
                                onMouseEnter={handleFilterMouseEnter}
                                onMouseLeave={handleFilterMouseLeave}
                            >
                                <FilterPanel filters={filters} setFilters={setFilters} />
                            </div>
                        )}
                    </div>
                    <div
                        className="relative"
                        onMouseEnter={handleDownloadMouseEnter}
                        onMouseLeave={handleDownloadMouseLeave}
                    >
                        <button
                            onClick={handleDownloadClick}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            Завантажити
                        </button>
                        {showDownload && (
                            <div
                                className="absolute right-0 mt-2 z-20 w-[400px] rounded-md shadow-lg"
                                onMouseEnter={handleDownloadMouseEnter}
                                onMouseLeave={handleDownloadMouseLeave}
                            >
                                <DownloadPanel members={members} keepPanelOpen={keepDownloadPanelOpen} />
                            </div>
                        )}
                    </div>
                    {(role === 'editor' || role === 'superadmin') && (
                        <button
                            onClick={() => navigate('/add-member')}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                        >
                            Додати
                        </button>
                    )}
                    {role === 'superadmin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                        >
                            Адмін-панель
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    >
                        Вийти
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white rounded-md shadow-md">
                    <thead className="bg-gray-100">
                    <tr>
                        <Th>Прізвище</Th>
                        <Th>Ім’я</Th>
                        <Th>По батькові</Th>
                        <Th>Дата народж.</Th>
                        <Th>Дата хрещення</Th>
                        <Th>Статус</Th>
                        <Th>Телефон</Th>
                        <Th>Вулиця</Th>
                        <Th>Будинок</Th>
                        <Th>Квартира</Th>
                        <Th>Служіння</Th>
                        <Th>Група</Th>
                        <Th>Диякон</Th>
                        <Th>Примітки</Th>
                        {(role === 'editor' || role === 'superadmin') && <Th>Дії</Th>}
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                            <Td>{member.last_name}</Td>
                            <Td>{member.first_name}</Td>
                            <Td>{member.middle_name}</Td>
                            <Td>{member.birth_date || "-"}</Td>
                            <Td>{member.baptism_date || "-"}</Td>
                            <Td>{member.statuses?.name}</Td>
                            <Td>{member.phone}</Td>
                            <Td>{member.street}</Td>
                            <Td>{member.building}</Td>
                            <Td>{member.apartment}</Td>
                            <Td>{member.ministry_types?.name}</Td>
                            <Td>{member.home_groups?.name}</Td>
                            <Td>{member.deacons?.full_name}</Td>
                            <Td>{member.notes}</Td>
                            {(role === 'editor' || role === 'superadmin') && (
                                <Td>
                                    <button
                                        onClick={() => navigate(`/edit-member/${member.id}`)}
                                        className="text-blue-500 hover:underline mr-2"
                                    >
                                        Редагувати
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMember(member.id)}
                                        className="text-red-500 hover:underline"
                                    >
                                        Видалити
                                    </button>
                                </Td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4 text-center">Підтвердження видалення</h2>
                        <p className="text-sm mb-4 text-center">
                            Ви впевнені, що хочете видалити цього члена?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                            >
                                Видалити
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Th({ children }) {
    return (
        <th className="text-left px-3 py-2 border-b text-sm font-semibold text-gray-700 whitespace-nowrap">
            {children}
        </th>
    );
}

function Td({ children }) {
    return (
        <td className="px-3 py-2 border-b text-sm text-gray-800 whitespace-nowrap">
            {children || "-"}
        </td>
    );
}