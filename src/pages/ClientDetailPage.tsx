import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientById } from '../api/clients';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import type { Client } from '../types/api';
import { ProjectsPage } from './ProjectsPage';

function ClientDetailPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadClient() {
            try {
                const data = await getClientById(id);

                if (!cancelled) {
                    setClient(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load client');
                }
            }
        }

        void loadClient();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (error) {
        return (
            <section className='page'>
                <Alert variant='error' title='Could not load client'>
                    {error}
                </Alert>
            </section>
        );
    }

    if (!client) {
        return (
            <section className='page'>
                <Loading
                    label='Loading client projects'
                    description='Checking the client and its recent project activity.'
                    size='large'
                    centred
                />
            </section>
        );
    }

    return (
        <ProjectsPage
            client={client}
            onClientUpdated={setClient}
            onClientDeleted={() => navigate('/clients')}
        />
    );
}

export { ClientDetailPage };
