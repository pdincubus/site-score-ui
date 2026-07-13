import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ORDER_OPTIONS, STATUS_OPTIONS, getClients } from '../api/clients';
import { normaliseAllowedValue, normaliseLimit, normalisePage } from '../api/query';
import { CreateClientForm } from '../components/clients/CreateClientForm';
import { EditClientForm } from '../components/clients/EditClientForm';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { ModalDialog } from '../components/feedback/ModalDialog';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Client, ClientListItem, PaginatedResponse, ResourceStatus } from '../types/api';

function formatClientDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function formatClientCount(value: number, label: string) {
    return `${value} ${label}${value === 1 ? '' : 's'}`;
}

function getEmptyClientsTitle(status: ResourceStatus) {
    if (status === 'archived') {
        return 'No archived clients found';
    }

    if (status === 'all') {
        return 'No clients found';
    }

    return 'No active clients found';
}

function getEmptyClientsMessage(status: ResourceStatus) {
    if (status === 'archived') {
        return 'Archived clients will appear here when you archive them.';
    }

    return 'Try changing your search or create a new client.';
}

function ClientsPage() {
    useDocumentTitle('Clients | Site Score UI');

    const [searchParams, setSearchParams] = useSearchParams();
    const [response, setResponse] = useState<PaginatedResponse<ClientListItem> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const page = normalisePage(searchParams.get('page'));
    const limit = normaliseLimit(searchParams.get('limit'));
    const search = searchParams.get('search') || '';
    const order = normaliseAllowedValue(searchParams.get('order'), ORDER_OPTIONS, 'desc');
    const status = normaliseAllowedValue(searchParams.get('status'), STATUS_OPTIONS, 'active');

    const updateQuery = useCallback(
        (next: Record<string, string>) => {
            const params = new URLSearchParams(searchParams);

            for (const [key, value] of Object.entries(next)) {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            }

            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    const loadClients = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const data = await getClients({
                page,
                limit,
                search,
                sort: 'createdAt',
                order,
                status: status === 'active' ? undefined : status
            });

            setResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load clients');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, order, status]);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    useEffect(() => {
        if (debouncedSearch === search) {
            return;
        }

        updateQuery({
            search: debouncedSearch,
            page: '1'
        });
    }, [debouncedSearch, search, updateQuery]);

    useEffect(() => {
        void loadClients();
    }, [loadClients, reloadKey]);

    useEffect(() => {
        setSuccessMessage('');
    }, [search, order, status, page]);

    function handleClientCreated(client: Client) {
        setSuccessMessage(`Client created: ${client.name}`);
        updateQuery({
            status: '',
            page: '1'
        });
        setReloadKey((value) => value + 1);
        setCreateDialogOpen(false);
    }

    function handleClientUpdated(client: Client) {
        setSuccessMessage(`Client updated: ${client.name}`);
        setReloadKey((value) => value + 1);
        setEditingClient(null);
    }

    function handleClientDeleted() {
        setSuccessMessage('Client deleted successfully');
        setReloadKey((value) => value + 1);
        setEditingClient(null);
    }

    function setPage(nextPage: number) {
        updateQuery({
            page: String(nextPage)
        });
    }

    return (
        <section className='page'>
            <div className='page-heading page-heading--with-actions'>
                <div>
                    <h1>Clients</h1>
                    <p>Manage client records for Site Score projects.</p>
                </div>
                <button type='button' onClick={() => setCreateDialogOpen(true)}>
                    Create client
                </button>
            </div>

            <ModalDialog
                title='Create client'
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            >
                {createDialogOpen ? (
                    <CreateClientForm variant='embedded' onCreated={handleClientCreated} />
                ) : null}
            </ModalDialog>

            <ModalDialog
                title='Edit client'
                open={Boolean(editingClient)}
                onClose={() => setEditingClient(null)}
            >
                {editingClient ? (
                    <EditClientForm
                        client={editingClient}
                        onUpdated={handleClientUpdated}
                        onDeleted={handleClientDeleted}
                        onCancel={() => setEditingClient(null)}
                    />
                ) : null}
            </ModalDialog>

            {successMessage ? (
                <Alert variant='success' title='Success'>
                    {successMessage}
                </Alert>
            ) : null}

            <div className='card'>
                <div className='toolbar'>
                    <label>
                        <span>Search</span>
                        <input
                            type='text'
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder='Search client name'
                        />
                    </label>

                    <label>
                        <span>Status</span>
                        <select
                            value={status}
                            onChange={(event) =>
                                updateQuery({
                                    status: event.target.value === 'active' ? '' : event.target.value,
                                    page: '1'
                                })
                            }
                        >
                            <option value='active'>Active clients</option>
                            <option value='archived'>Archived clients</option>
                            <option value='all'>All clients</option>
                        </select>
                    </label>

                    <label>
                        <span>Order</span>
                        <select
                            value={order}
                            onChange={(event) =>
                                updateQuery({
                                    order: event.target.value,
                                    page: '1'
                                })
                            }
                        >
                            <option value='desc'>Newest first</option>
                            <option value='asc'>Oldest first</option>
                        </select>
                    </label>
                </div>

                {isLoading ? (
                    <Loading
                        label='Checking your clients'
                        description='If the API has been idle, your client list can take a few seconds to wake up.'
                        size='large'
                        centred
                    />
                ) : null}

                {error ? (
                    <Alert variant='error' title='Could not load clients'>
                        {error}
                    </Alert>
                ) : null}

                {!isLoading && !error && response ? (
                    <>
                        {response.data.length === 0 ? (
                            <Alert variant='info' title={getEmptyClientsTitle(status)}>
                                {getEmptyClientsMessage(status)}
                            </Alert>
                        ) : (
                            <ul className='item-list'>
                                {response.data.map((client) => (
                                    <li key={client.id} className='item-card'>
                                        <div className='item-card__header'>
                                            <h2>
                                                <Link to={`/clients/${client.id}`}>{client.name}</Link>
                                            </h2>
                                            <div className='item-card__actions'>
                                                {client.archivedAt ? (
                                                    <span className='status-pill'>Archived</span>
                                                ) : null}
                                                <button
                                                    type='button'
                                                    onClick={() => setEditingClient(client)}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>

                                        <ul className='client-meta' aria-label={`${client.name} details`}>
                                            <li>Created {formatClientDate(client.createdAt)}</li>
                                            {client.archivedAt ? (
                                                <li>Archived {formatClientDate(client.archivedAt)}</li>
                                            ) : null}
                                            <li>{formatClientCount(client.summary.projectCount, 'project')}</li>
                                            <li>{formatClientCount(client.summary.reportCount, 'result')}</li>
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className='pagination'>
                            <button
                                type='button'
                                onClick={() => setPage(Math.max(page - 1, 1))}
                                disabled={page <= 1}
                            >
                                Previous
                            </button>

                            <span>
                                Page {response.pagination.page} of {Math.max(response.pagination.totalPages, 1)}
                            </span>

                            <button
                                type='button'
                                onClick={() => setPage(page + 1)}
                                disabled={page >= response.pagination.totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}

export { ClientsPage };
