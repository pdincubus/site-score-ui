import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from 'react';
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth';
import { setOnUnauthorized } from '../api/client';
import type { User } from '../types/api';

type LoginInput = {
    email: string;
    password: string;
};

type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (input: LoginInput) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        setOnUnauthorized(() => {
            setUser(null);
            setIsLoading(false);
        });

        return () => {
            setOnUnauthorized(null);
        };
    }, []);

    const login = useCallback(async (input: LoginInput) => {
        const loggedInUser = await loginRequest(input);
        setUser(loggedInUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            isAuthenticated: Boolean(user),
            login,
            logout,
            refreshUser
        }),
        [user, isLoading, login, logout, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}

export { AuthProvider, useAuth };