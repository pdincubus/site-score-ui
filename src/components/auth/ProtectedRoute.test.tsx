import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

const authState = {
    isAuthenticated: false,
    isLoading: false
};

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading
    })
}));

describe('ProtectedRoute', () => {
    it('renders loading state while auth is initializing', () => {
        authState.isLoading = true;
        authState.isAuthenticated = false;

        render(
            <MemoryRouter initialEntries={['/projects']}>
                <Routes>
                    <Route
                        path='/projects'
                        element={
                            <ProtectedRoute>
                                <p>Projects page</p>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects unauthenticated users to login', () => {
        authState.isLoading = false;
        authState.isAuthenticated = false;

        render(
            <MemoryRouter initialEntries={['/projects']}>
                <Routes>
                    <Route
                        path='/projects'
                        element={
                            <ProtectedRoute>
                                <p>Projects page</p>
                            </ProtectedRoute>
                        }
                    />
                    <Route path='/login' element={<p>Login page</p>} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('renders children for authenticated users', () => {
        authState.isLoading = false;
        authState.isAuthenticated = true;

        render(
            <MemoryRouter initialEntries={['/projects']}>
                <Routes>
                    <Route
                        path='/projects'
                        element={
                            <ProtectedRoute>
                                <p>Projects page</p>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Projects page')).toBeInTheDocument();
    });
});
