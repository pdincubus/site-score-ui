import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Dashboard } from '../types/api';

function formatActivityDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function DashboardPage() {
    useDocumentTitle('Dashboard | Site Score UI');

    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                const data = await getDashboard();

                if (!cancelled) {
                    setDashboard(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load dashboard');
                }
            }
        }

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section className='page'>
            <div className='page-heading'>
                <h1>Dashboard</h1>
                <p>Recent activity across your shared Site Score workspace.</p>
            </div>

            {!dashboard && !error ? (
                <Loading
                    label='Loading your dashboard'
                    description='Gathering recent clients, projects and results.'
                    size='large'
                    centred
                />
            ) : null}

            {error ? (
                <Alert variant='error' title='Could not load dashboard'>
                    {error}
                </Alert>
            ) : null}

            {dashboard ? (
                <div className='dashboard-grid'>
                    <section className='card' aria-labelledby='recent-clients-heading'>
                        <div className='card-heading'>
                            <h2 id='recent-clients-heading'>Recent clients</h2>
                            <Link to='/clients'>View all clients</Link>
                        </div>
                        {dashboard.clients.length === 0 ? (
                            <p>No clients yet.</p>
                        ) : (
                            <ul className='item-list'>
                                {dashboard.clients.map((client) => (
                                    <li key={client.id} className='item-card'>
                                        <h3>
                                            <Link to={`/clients/${client.id}`}>{client.name}</Link>
                                        </h3>
                                        <p>Added {formatActivityDate(client.createdAt)}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className='card' aria-labelledby='recent-projects-heading'>
                        <div className='card-heading'>
                            <h2 id='recent-projects-heading'>Recent projects</h2>
                            <Link to='/projects'>View all projects</Link>
                        </div>
                        {dashboard.projects.length === 0 ? (
                            <p>No projects yet.</p>
                        ) : (
                            <ul className='item-list'>
                                {dashboard.projects.map((project) => (
                                    <li key={project.id} className='item-card'>
                                        <h3>
                                            <Link to={`/projects/${project.id}`}>{project.name}</Link>
                                        </h3>
                                        <p>
                                            {project.clientName || 'Unassigned'} · Added{' '}
                                            {formatActivityDate(project.createdAt)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className='card' aria-labelledby='recent-results-heading'>
                        <div className='card-heading'>
                            <h2 id='recent-results-heading'>Recent results</h2>
                        </div>
                        {dashboard.results.length === 0 ? (
                            <p>No results yet.</p>
                        ) : (
                            <ul className='item-list'>
                                {dashboard.results.map((result) => (
                                    <li key={result.id} className='item-card'>
                                        <h3>
                                            <Link to={`/projects/${result.projectId}#result-${result.id}`}>
                                                {result.title}
                                            </Link>
                                        </h3>
                                        <p>
                                            {result.projectName}
                                            {result.clientName ? ` · ${result.clientName}` : ''} ·{' '}
                                            {formatActivityDate(result.createdAt)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            ) : null}
        </section>
    );
}

export { DashboardPage };
