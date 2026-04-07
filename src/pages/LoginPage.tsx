import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function LoginPage() {
    useDocumentTitle('Log in | Site Score UI');

    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (isLoading) {
        return (
            <section className='page'>
                <Loading label='Checking your session...' size='large' centred />
            </section>
        );
    }

    if (isAuthenticated) {
        return <Navigate to='/projects' replace />;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login({ email, password });
            navigate('/projects');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className='page'>
            <div className='card card--narrow'>
                <h1>Log in</h1>
                <p>Use your Site Score API account.</p>

                <form onSubmit={handleSubmit} className='form-stack'>
                    <label>
                        <span>Email</span>
                        <input
                            type='email'
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete='email'
                        />
                    </label>

                    <label>
                        <span>Password</span>
                        <input
                            type='password'
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete='current-password'
                        />
                    </label>

                    {error ? (
                        <Alert variant='error' title='Login failed'>
                            {error}
                        </Alert>
                    ) : null}

                    <button type='submit' disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log in'}
                    </button>
                </form>
            </div>
        </section>
    );
}

export { LoginPage };