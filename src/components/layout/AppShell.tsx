import { Link, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

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
                    <Link to='/projects' className='site-title'>
                        Site Score UI
                    </Link>

                    <div className='site-header__actions'>
                        {isAuthenticated && user ? (
                            <>
                                <span className='user-badge'>{user.email}</span>
                                <button type='button' onClick={handleLogout}>
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