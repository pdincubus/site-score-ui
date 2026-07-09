import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/useAuth';
import { Loading } from '../feedback/Loading';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <section className='page'>
                <Loading
                    label='Checking your session'
                    description='If the API has been idle, this can take a few seconds while it wakes up.'
                    size='large'
                    centred
                />
            </section>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return <>{children}</>;
}

export { ProtectedRoute };
