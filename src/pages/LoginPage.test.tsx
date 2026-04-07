import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

const navigateMock = vi.fn();
const loginMock = vi.fn();

const authState = {
    isAuthenticated: false,
    isLoading: false
};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock
    };
});

vi.mock('../hooks/useDocumentTitle', () => ({
    useDocumentTitle: vi.fn()
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        login: loginMock,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading
    })
}));

describe('LoginPage', () => {
    beforeEach(() => {
        authState.isAuthenticated = false;
        authState.isLoading = false;
        loginMock.mockReset();
        navigateMock.mockReset();
    });

    it('renders empty email and password inputs by default', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
        const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

        expect(emailInput.value).toBe('');
        expect(passwordInput.value).toBe('');
    });

    it('submits credentials and navigates on successful login', async () => {
        loginMock.mockResolvedValue(undefined);

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith({
                email: 'user@example.com',
                password: 'secret123'
            });
            expect(navigateMock).toHaveBeenCalledWith('/projects');
        });
    });

    it('shows an error message when login fails', async () => {
        loginMock.mockRejectedValue(new Error('Invalid credentials'));

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad-pass' } });
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
        expect(navigateMock).not.toHaveBeenCalled();
    });
});
