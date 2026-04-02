import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getProjectById, getProjectReports } from '../api/projects';
import type { PaginatedResponse, Project, Report } from '../types/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';


function ProjectDetailPage() {
    const { id = '' } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [project, setProject] = useState<Project | null>(null);
    const [reports, setReports] = useState<PaginatedResponse<Report> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '10');

    useEffect(() => {
        async function loadProjectData() {
            setIsLoading(true);
            setError('');

            try {
                const [projectData, reportData] = await Promise.all([
                    getProjectById(id),
                    getProjectReports(id, page, limit)
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
    }, [id, page, limit]);

    useDocumentTitle(project ? `${project.name} | Site Score UI` : 'Project | Site Score UI');

    function setPage(nextPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    }

    return (
        <section className='page'>
            <p>
                <Link to='/projects'>← Back to projects</Link>
            </p>

            {isLoading ? <p>Loading project...</p> : null}
            {error ? <p className='error-text'>{error}</p> : null}

            {!isLoading && !error && project ? (
                <>
                    <div className='page-heading'>
                        <h1>{project.name}</h1>
                        <p>{project.url}</p>
                    </div>

                    <div className='card'>
                        <h2>Reports</h2>

                        {reports && reports.data.length > 0 ? (
                            <>
                                <ul className='item-list'>
                                    {reports.data.map((report) => (
                                        <li key={report.id} className='item-card'>
                                            <h3>{report.title}</h3>
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
                            <p>No reports found for this project.</p>
                        )}
                    </div>
                </>
            ) : null}
        </section>
    );
}

export { ProjectDetailPage };