import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ORDER_OPTIONS, PROJECT_SORT_OPTIONS, getProjects } from '../api/projects';
import { normaliseAllowedValue, normaliseLimit, normalisePage } from '../api/query';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { ModalDialog } from '../components/feedback/ModalDialog';
import { CreateProjectForm } from '../components/projects/CreateProjectForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type {
    PaginatedResponse,
    Project,
    ProjectListItem,
    ProjectSummaryScores
} from '../types/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

function formatProjectDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function formatCount(value: number, singularLabel: string) {
    const label = value === 1 ? singularLabel : `${singularLabel}s`;

    return `${value} ${label}`;
}

function getProjectSummary(project: ProjectListItem) {
    return project.summary ?? null;
}

function getLatestAverageScore(scores: ProjectSummaryScores | null) {
    if (!scores) {
        return null;
    }

    const total =
        scores.performanceScore +
        scores.accessibilityScore +
        scores.seoScore +
        scores.bestPracticesScore +
        scores.agenticBrowsingScore;

    return Math.round(total / 5);
}

function ProjectsPage() {
    useDocumentTitle('Projects | Site Score UI');

    const [searchParams, setSearchParams] = useSearchParams();
    const [response, setResponse] = useState<PaginatedResponse<ProjectListItem> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const page = normalisePage(searchParams.get('page'));
    const limit = normaliseLimit(searchParams.get('limit'));
    const search = searchParams.get('search') || '';
    const sort = normaliseAllowedValue(searchParams.get('sort'), PROJECT_SORT_OPTIONS, 'createdAt');
    const order = normaliseAllowedValue(searchParams.get('order'), ORDER_OPTIONS, 'desc');

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
    }, [debouncedSearch, search, updateQuery]);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects, reloadKey]);

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
                    <Loading
                        label='Loading your projects'
                        description='The API may be waking from an idle state. This usually clears in a few seconds.'
                        centred
                    />
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
                                {response.data.map((project) => {
                                    const summary = getProjectSummary(project);
                                    const latestAverageScore = getLatestAverageScore(
                                        summary?.latestScores ?? null
                                    );

                                    return (
                                        <li key={project.id} className='item-card'>
                                            <h2>
                                                <Link to={`/projects/${project.id}`}>
                                                    {project.name}
                                                </Link>
                                            </h2>
                                            <p className='project-card__url'>{project.url}</p>
                                            {summary ? (
                                                <dl className='project-summary'>
                                                    <div>
                                                        <dt>Created</dt>
                                                        <dd>{formatProjectDate(project.createdAt)}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Reports</dt>
                                                        <dd>{formatCount(summary.reportCount, 'report')}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Groups</dt>
                                                        <dd>{formatCount(summary.reportGroupCount, 'group')}</dd>
                                                    </div>
                                                    <div>
                                                        <dt>Latest report</dt>
                                                        <dd title={summary.latestReportTitle || undefined}>
                                                            {summary.latestReportCreatedAt
                                                                ? formatProjectDate(summary.latestReportCreatedAt)
                                                                : 'No reports yet'}
                                                        </dd>
                                                    </div>
                                                    {latestAverageScore === null ? null : (
                                                        <div className='project-summary__score'>
                                                            <dt>Latest average score</dt>
                                                            <dd>
                                                                <span className='project-summary__score-value'>
                                                                    {latestAverageScore}
                                                                </span>
                                                                <span className='visually-hidden'> out of 100</span>
                                                            </dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            ) : (
                                                <p className='muted-text'>Project summary unavailable.</p>
                                            )}
                                        </li>
                                    );
                                })}
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
