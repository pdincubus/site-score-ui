import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/useAuth';
import './AppShell.css';

function AppShell({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <div className='app-shell'>
            <header className='site-header'>
                <div className='site-header__inner'>
                    <Link to='/dashboard' className='site-title'>
                        Site Score UI
                    </Link>

                    <div className='site-header__actions'>
                        {isAuthenticated && user ? (
                            <>
                                <nav className='site-nav' aria-label='Main navigation'>
                                    <Link to='/dashboard'>Dashboard</Link>
                                    <Link to='/clients'>Clients</Link>
                                    <Link to='/projects'>Projects</Link>
                                </nav>
                                <span className='user-badge'>{user.email}</span>
                                <button
                                    className='site-header__logout'
                                    type='button'
                                    onClick={handleLogout}
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <Link to='/login'>Log in</Link>
                        )}
                    </div>
                </div>
            </header>

            <main className='site-main'>
                {children}
            </main>
        </div>
    );
}

export { AppShell };
