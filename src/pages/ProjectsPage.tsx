import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/projects';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { ModalDialog } from '../components/feedback/ModalDialog';
import { CreateProjectForm } from '../components/projects/CreateProjectForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { PaginatedResponse, Project } from '../types/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

function ProjectsPage() {
    useDocumentTitle('Projects | Site Score UI');

    const [searchParams, setSearchParams] = useSearchParams();
    const [response, setResponse] = useState<PaginatedResponse<Project> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sort') || 'createdAt') as 'createdAt' | 'name';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    const loadProjects = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const data = await getProjects({
                page,
                limit,
                search,
                sort,
                order
            });

            setResponse(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, sort, order]);

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
    }, [debouncedSearch, search]);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects, reloadKey]);

    function updateQuery(next: Record<string, string>) {
        const params = new URLSearchParams(searchParams);

        for (const [key, value] of Object.entries(next)) {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        }

        setSearchParams(params);
    }

    useEffect(() => {
        setSuccessMessage('');
    }, [search, sort, order, page]);

    function handleProjectCreated(project: Project) {
        setSuccessMessage(`Project created: ${project.name}`);
        setReloadKey((value) => value + 1);
        setCreateDialogOpen(false);
    }

    return (
        <section className='page'>
            <div className='page-heading page-heading--with-actions'>
                <div>
                    <h1>Projects</h1>
                    <p>Browse projects from the Site Score API.</p>
                </div>
                <button type='button' onClick={() => setCreateDialogOpen(true)}>
                    Create project
                </button>
            </div>

            <ModalDialog
                title='Create project'
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
            >
                {createDialogOpen ? (
                    <CreateProjectForm variant='embedded' onCreated={handleProjectCreated} />
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
                            placeholder='Search name or URL'
                        />
                    </label>

                    <label>
                        <span>Sort</span>
                        <select
                            value={sort}
                            onChange={(event) =>
                                updateQuery({
                                    sort: event.target.value,
                                    page: '1'
                                })
                            }
                        >
                            <option value='createdAt'>Created date</option>
                            <option value='name'>Name</option>
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
                            <option value='desc'>Descending</option>
                            <option value='asc'>Ascending</option>
                        </select>
                    </label>
                </div>

                {isLoading ? (
                    <Loading label='Loading projects...' centred />
                ) : null}

                {error ? (
                    <Alert variant='error' title='Could not load projects'>
                        {error}
                    </Alert>
                ) : null}

                {!isLoading && !error && response ? (
                    <>
                        {response.data.length === 0 ? (
                            <Alert variant='info' title='No projects found'>
                                Try changing your search or create a new project.
                            </Alert>
                        ) : (
                            <ul className='item-list'>
                                {response.data.map((project) => (
                                    <li key={project.id} className='item-card'>
                                        <h2>
                                            <Link to={`/projects/${project.id}`}>
                                                {project.name}
                                            </Link>
                                        </h2>
                                        <p>{project.url}</p>
                                        <p className='muted-text'>
                                            Created: {new Date(project.createdAt).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className='pagination'>
                            <button
                                type='button'
                                onClick={() =>
                                    updateQuery({
                                        page: String(Math.max(page - 1, 1))
                                    })
                                }
                                disabled={page <= 1}
                            >
                                Previous
                            </button>

                            <span>
                                Page {response.pagination.page} of {Math.max(response.pagination.totalPages, 1)}
                            </span>

                            <button
                                type='button'
                                onClick={() =>
                                    updateQuery({
                                        page: String(page + 1)
                                    })
                                }
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

export { ProjectsPage };