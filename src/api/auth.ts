import { apiFetch } from './client';
import type { User } from '../types/api';

type LoginInput = {
    email: string;
    password: string;
};

function login(input: LoginInput) {
    return apiFetch<User>('/auth/login', {
        method: 'POST',
        bodyJson: input
    });
}

function logout() {
    return apiFetch<void>('/auth/logout', {
        method: 'POST'
    });
}

function getCurrentUser() {
    return apiFetch<User>('/auth/me');
}

export { login, logout, getCurrentUser };