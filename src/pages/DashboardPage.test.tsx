import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import { DashboardPage } from './DashboardPage';

vi.mock('../api/dashboard', () => ({
    getDashboard: vi.fn()
}));

vi.mock('../hooks/useDocumentTitle', () => ({
    useDocumentTitle: vi.fn()
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.mocked(getDashboard).mockReset();
    });

    it('renders recent clients, projects, and results with contextual links', async () => {
        vi.mocked(getDashboard).mockResolvedValue({
            clients: [
                {
                    id: 'client-1',
                    name: 'Crayons & Code',
                    createdAt: '2026-07-13T09:00:00.000Z'
                }
            ],
            projects: [
                {
                    id: 'project-1',
                    name: 'Marketing site',
                    clientId: 'client-1',
                    clientName: 'Crayons & Code',
                    createdAt: '2026-07-13T10:00:00.000Z'
                }
            ],
            results: [
                {
                    id: 'result-1',
                    title: 'Homepage mobile',
                    projectId: 'project-1',
                    projectName: 'Marketing site',
                    clientId: 'client-1',
                    clientName: 'Crayons & Code',
                    createdAt: '2026-07-13T11:00:00.000Z'
                }
            ]
        });

        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Crayons & Code' })).toHaveAttribute(
            'href',
            '/clients/client-1'
        );
        expect(screen.getByRole('link', { name: 'Marketing site' })).toHaveAttribute(
            'href',
            '/projects/project-1'
        );
        expect(screen.getByRole('link', { name: 'Homepage mobile' })).toHaveAttribute(
            'href',
            '/projects/project-1#result-result-1'
        );
    });

    it('renders useful empty states', async () => {
        vi.mocked(getDashboard).mockResolvedValue({
            clients: [],
            projects: [],
            results: []
        });

        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>
        );

        expect(await screen.findByText('No clients yet.')).toBeInTheDocument();
        expect(screen.getByText('No projects yet.')).toBeInTheDocument();
        expect(screen.getByText('No results yet.')).toBeInTheDocument();
    });
});
