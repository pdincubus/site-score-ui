import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/projects';
import type { PaginatedResponse, Project } from '../types/api';

function ProjectsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [response, setResponse] = useState<PaginatedResponse<Project> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sort') || 'createdAt') as 'createdAt' | 'name';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    useEffect(() => {
        async function loadProjects() {
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
        }

        void loadProjects();
    }, [page, limit, search, sort, order]);

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

    return (
        <section className='page'>
            <div className='page-heading'>
                <h1>Projects</h1>
                <p>Browse projects from the Site Score API.</p>
            </div>

            <div className='card'>
                <div className='toolbar'>
                    <label>
                        <span>Search</span>
                        <input
                            type='text'
                            value={search}
                            onChange={(event) =>
                                updateQuery({
                                    search: event.target.value,
                                    page: '1'
                                })
                            }
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

                {isLoading ? <p>Loading projects...</p> : null}
                {error ? <p className='error-text'>{error}</p> : null}

                {!isLoading && !error && response ? (
                    <>
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

                        {response.data.length === 0 ? <p>No projects found.</p> : null}

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