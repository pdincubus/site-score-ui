import { render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getProjects } from '../api/projects';
import { ProjectsPage } from './ProjectsPage';
import type { PaginatedResponse, ProjectListItem } from '../types/api';

vi.mock('../api/projects', () => ({
    ORDER_OPTIONS: ['asc', 'desc'],
    PROJECT_SORT_OPTIONS: ['createdAt', 'name'],
    getProjects: vi.fn()
}));

vi.mock('../hooks/useDocumentTitle', () => ({
    useDocumentTitle: vi.fn()
}));

function projectResponse(data: ProjectListItem[]): PaginatedResponse<ProjectListItem> {
    return {
        data,
        pagination: {
            page: 1,
            limit: 10,
            total: data.length,
            totalPages: data.length > 0 ? 1 : 0
        }
    };
}

function renderProjectsPage() {
    return render(
        <MemoryRouter>
            <ProjectsPage />
        </MemoryRouter>
    );
}

describe('ProjectsPage', () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a friendly project loading state while the API responds', () => {
        vi.mocked(getProjects).mockImplementation(() => new Promise(() => undefined));

        renderProjectsPage();

        expect(screen.getByRole('status')).toHaveTextContent('Checking your projects');
        expect(
            screen.getByText(
                'If the API has been idle, your project list can take a few seconds to wake up.'
            )
        ).toBeInTheDocument();
        expect(screen.queryByText('Loading your projects')).not.toBeInTheDocument();
    });

    it('shows compact summary stats for projects with reports', async () => {
        vi.mocked(getProjects).mockResolvedValue(
            projectResponse([
                {
                    id: 'project-1',
                    name: 'Crayons & Code',
                    url: 'https://crayonsandcode.co.uk/',
                    createdAt: '2026-07-01T08:30:00.000Z',
                    summary: {
                        reportCount: 6,
                        reportGroupCount: 2,
                        latestReportCreatedAt: '2026-07-08T09:30:00.000Z',
                        latestReportTitle: 'Homepage mobile latest',
                        latestScores: {
                            performanceScore: 90,
                            accessibilityScore: 100,
                            seoScore: 95,
                            bestPracticesScore: 85,
                            agenticBrowsingScore: 80
                        }
                    }
                }
            ])
        );

        renderProjectsPage();

        const projectHeading = await screen.findByRole('heading', { name: 'Crayons & Code' });
        const projectCard = projectHeading.closest('li');

        expect(projectCard).not.toBeNull();
        expect(within(projectCard as HTMLElement).getByText('6 reports')).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('2 groups')).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('Latest report')).toBeInTheDocument();
        expect(
            within(projectCard as HTMLElement).getByText(
                new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }).format(new Date('2026-07-08T09:30:00.000Z'))
            )
        ).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('Latest average score')).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('90')).toBeInTheDocument();
    });

    it('shows an empty project summary state when a project has no reports', async () => {
        vi.mocked(getProjects).mockResolvedValue(
            projectResponse([
                {
                    id: 'project-empty',
                    name: 'Fresh Start Studio',
                    url: 'https://fresh-start.example/',
                    createdAt: '2026-07-08T08:30:00.000Z',
                    summary: {
                        reportCount: 0,
                        reportGroupCount: 0,
                        latestReportCreatedAt: null,
                        latestReportTitle: null,
                        latestScores: null
                    }
                }
            ])
        );

        renderProjectsPage();

        const projectHeading = await screen.findByRole('heading', { name: 'Fresh Start Studio' });
        const projectCard = projectHeading.closest('li');

        expect(projectCard).not.toBeNull();
        expect(within(projectCard as HTMLElement).getByText('0 reports')).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('0 groups')).toBeInTheDocument();
        expect(within(projectCard as HTMLElement).getByText('No reports yet')).toBeInTheDocument();
        expect(
            within(projectCard as HTMLElement).queryByText('Latest average score')
        ).not.toBeInTheDocument();
    });
});
