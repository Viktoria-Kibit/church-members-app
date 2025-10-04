import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setIsLoading(false);
                    navigate('/auth', { replace: true });
                    return;
                }
                const { data: { user } } = await supabase.auth.getUser();
                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profileError) {
                    console.error('Profile error:', profileError);
                    setIsLoading(false);
                    navigate('/auth', { replace: true });
                    return;
                }
                setUserRole(profile.role);
                setIsAuthenticated(true);
                setIsLoading(false);
                // Перевірка ролі
                if (requiredRole && !Array.isArray(requiredRole) && profile.role !== requiredRole) {
                    navigate('/members', { replace: true });
                    return;
                }
                if (requiredRole && Array.isArray(requiredRole) && !requiredRole.includes(profile.role)) {
                    navigate('/members', { replace: true });
                    return;
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setIsLoading(false);
                navigate('/auth', { replace: true });
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session);
            if (!session) {
                navigate('/auth', { replace: true });
            } else {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single()
                        .then(({ data: profile, error: profileError }) => {
                            if (profileError) {
                                navigate('/auth', { replace: true });
                                return;
                            }
                            setUserRole(profile.role);
                            // Перевірка ролі
                            if (requiredRole && !Array.isArray(requiredRole) && profile.role !== requiredRole) {
                                navigate('/members', { replace: true });
                                return;
                            }
                            if (requiredRole && Array.isArray(requiredRole) && !requiredRole.includes(profile.role)) {
                                navigate('/members', { replace: true });
                                return;
                            }
                        });
                });
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate, requiredRole]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated && (!requiredRole || (Array.isArray(requiredRole) ? requiredRole.includes(userRole) : userRole === requiredRole)) ? children : null;
}

export default ProtectedRoute;