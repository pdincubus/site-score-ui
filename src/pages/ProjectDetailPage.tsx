import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getProjectById, getProjectReports } from '../api/projects';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { EditProjectForm } from '../components/projects/EditProjectForm';
import { CreateReportForm } from '../components/reports/CreateReportForm';
import { EditReportForm } from '../components/reports/EditReportForm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { PaginatedResponse, Project, Report } from '../types/api';

function ProjectDetailPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [project, setProject] = useState<Project | null>(null);
    const [reports, setReports] = useState<PaginatedResponse<Report> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sort = (searchParams.get('sort') || 'createdAt') as 'createdAt' | 'title';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';

    useDocumentTitle(project ? `${project.name} | Site Score UI` : 'Project | Site Score UI');

    useEffect(() => {
        async function loadProjectData() {
            setIsLoading(true);
            setError('');
    
            try {
                const [projectData, reportData] = await Promise.all([
                    getProjectById(id),
                    getProjectReports(id, {
                        page,
                        limit,
                        search,
                        sort,
                        order
                    })
                ]);
    
                setProject(projectData);
                setReports(reportData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load project');
            } finally {
                setIsLoading(false);
            }
        }
    
        if (id) {
            void loadProjectData();
        }
    }, [id, page, limit, search, sort, order, reloadKey]);

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
    }, [debouncedSearch, search, searchParams]);

    useEffect(() => {
        setSuccessMessage('');
    }, [search, sort, order, page]);

    function setPage(nextPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    }

    function handleProjectUpdated(updatedProject: Project) {
        setProject(updatedProject);
        setSuccessMessage(`Project updated: ${updatedProject.name}`);
    }

    function handleProjectDeleted() {
        navigate('/projects');
    }

    function handleReportCreated() {
        setSuccessMessage('Report created successfully');
        setReloadKey((value) => value + 1);
    }

    function handleReportUpdated(updatedReport: Report) {
        setReports((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                data: current.data.map((report) =>
                    report.id === updatedReport.id ? updatedReport : report
                )
            };
        });

        setEditingReportId(null);
        setSuccessMessage(`Report updated: ${updatedReport.title}`);
    }

    function handleReportDeleted(reportId: string) {
        setReports((current) => {
            if (!current) {
                return current;
            }

            const nextData = current.data.filter((report) => report.id !== reportId);
            const nextTotal = Math.max(current.pagination.total - 1, 0);

            return {
                data: nextData,
                pagination: {
                    ...current.pagination,
                    total: nextTotal,
                    totalPages: nextTotal === 0 ? 0 : Math.ceil(nextTotal / current.pagination.limit)
                }
            };
        });

        setEditingReportId(null);
        setSuccessMessage('Report deleted successfully');
    }

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
            <p>
                <Link to='/projects'>← Back to projects</Link>
            </p>

            {isLoading ? (
                <Loading label='Loading project...' size='large' centred />
            ) : null}

            {error ? (
                <Alert variant='error' title='Could not load project'>
                    {error}
                </Alert>
            ) : null}

            {!isLoading && !error && project ? (
                <>
                    <div className='page-heading'>
                        <h1>{project.name}</h1>
                        <p>{project.url}</p>
                    </div>

                    {successMessage ? (
                        <Alert variant='success' title='Success'>
                            {successMessage}
                        </Alert>
                    ) : null}

                    <EditProjectForm
                        project={project}
                        onUpdated={handleProjectUpdated}
                        onDeleted={handleProjectDeleted}
                    />

                    <CreateReportForm
                        projectId={project.id}
                        onCreated={handleReportCreated}
                    />

                    <div className='card'>
                        <h2>Reports</h2>

                        <div className='toolbar'>
                            <label>
                                <span>Search</span>
                                <input
                                    type='text'
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder='Search title or summary'
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
                                    <option value='title'>Title</option>
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

                        {reports && reports.data.length > 0 ? (
                            <>
                                <ul className='item-list'>
                                    {reports.data.map((report) => (
                                        <li key={report.id} className='item-card'>
                                            {editingReportId === report.id ? (
                                                <>
                                                    <h3>Edit report</h3>
                                                    <EditReportForm
                                                        report={report}
                                                        onUpdated={handleReportUpdated}
                                                        onDeleted={handleReportDeleted}
                                                        onCancel={() => setEditingReportId(null)}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div className='item-card__header'>
                                                        <h3>{report.title}</h3>
                                                        <button
                                                            type='button'
                                                            onClick={() => setEditingReportId(report.id)}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>

                                                    <p>{report.summary}</p>

                                                    <dl className='score-grid'>
                                                        <div>
                                                            <dt>Accessibility</dt>
                                                            <dd>{report.accessibilityScore}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>Performance</dt>
                                                            <dd>{report.performanceScore}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>SEO</dt>
                                                            <dd>{report.seoScore}</dd>
                                                        </div>
                                                        <div>
                                                            <dt>UX</dt>
                                                            <dd>{report.uxScore}</dd>
                                                        </div>
                                                    </dl>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                <div className='pagination'>
                                    <button
                                        type='button'
                                        onClick={() => setPage(Math.max(page - 1, 1))}
                                        disabled={page <= 1}
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page {reports.pagination.page} of {Math.max(reports.pagination.totalPages, 1)}
                                    </span>

                                    <button
                                        type='button'
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= reports.pagination.totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Alert variant='info' title='No reports found'>
                                Create a report to start reviewing this project.
                            </Alert>
                        )}
                    </div>
                </>
            ) : null}
        </section>
    );
}

export { ProjectDetailPage };