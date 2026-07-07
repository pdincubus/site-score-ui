import { createContext } from 'react';
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

export { AuthContext };
export type { AuthContextValue, LoginInput };
