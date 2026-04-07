import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/auth';
import { setOnUnauthorized } from '../api/client';
import { apiFetch } from '../api/client';

vi.mock('../api/auth', () => ({
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn()
}));

function AuthHarness() {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    return (
        <div>
            <p>{isLoading ? 'loading' : 'ready'}</p>
            <p>{isAuthenticated ? `signed-in:${user?.email}` : 'signed-out'}</p>
            <button
                type='button'
                onClick={() => {
                    void logout().catch(() => undefined);
                }}
            >
                Logout
            </button>
        </div>
    );
}

describe('AuthContext', () => {
    afterEach(() => {
        setOnUnauthorized(null);
        vi.clearAllMocks();
    });

    it('clears local user state even when logout API fails', async () => {
        vi.mocked(authApi.getCurrentUser).mockResolvedValue({
            id: 'u1',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z'
        });
        vi.mocked(authApi.logout).mockRejectedValue(new Error('network failure'));

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>
        );

        await screen.findByText('signed-in:test@example.com');
        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        await waitFor(() => {
            expect(screen.getByText('signed-out')).toBeInTheDocument();
        });
    });

    it('clears auth state when an api request returns 401', async () => {
        vi.mocked(authApi.getCurrentUser).mockResolvedValue({
            id: 'u1',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z'
        });
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            })
        );

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>
        );

        await screen.findByText('signed-in:test@example.com');
        await expect(apiFetch('/projects')).rejects.toThrow('Unauthorized');

        await waitFor(() => {
            expect(screen.getByText('signed-out')).toBeInTheDocument();
        });
    });

    it('stops loading and remains signed out when current user fetch fails', async () => {
        vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('ready')).toBeInTheDocument();
            expect(screen.getByText('signed-out')).toBeInTheDocument();
        });
    });

    it('removes unauthorized handler on unmount', async () => {
        vi.mocked(authApi.getCurrentUser).mockResolvedValue({
            id: 'u1',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            })
        );

        const { unmount } = render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>
        );

        await screen.findByText('signed-in:test@example.com');
        unmount();

        await expect(apiFetch('/projects')).rejects.toThrow('Unauthorized');
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('does not emit React unmounted state update warnings after unmount', async () => {
        vi.mocked(authApi.getCurrentUser).mockResolvedValue({
            id: 'u1',
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            })
        );

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { unmount } = render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>
        );

        await screen.findByText('signed-in:test@example.com');
        unmount();

        await expect(apiFetch('/projects')).rejects.toThrow('Unauthorized');

        const combinedErrors = consoleErrorSpy.mock.calls.map((call) => String(call[0])).join('\n');
        expect(combinedErrors).not.toContain("Can't perform a React state update on an unmounted component");
    });
});
