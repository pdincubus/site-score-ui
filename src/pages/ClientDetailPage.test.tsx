import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getClientById } from '../api/clients';
import { getProjects } from '../api/projects';
import { ClientDetailPage } from './ClientDetailPage';

vi.mock('../api/clients', () => ({
    getClientById: vi.fn(),
    updateClient: vi.fn(),
    archiveClient: vi.fn(),
    restoreClient: vi.fn(),
    deleteClient: vi.fn()
}));

vi.mock('../api/projects', () => ({
    ORDER_OPTIONS: ['asc', 'desc'],
    PROJECT_SORT_OPTIONS: ['createdAt', 'name'],
    STATUS_OPTIONS: ['active', 'archived', 'all'],
    getProjects: vi.fn(),
    createProject: vi.fn()
}));

vi.mock('../hooks/useDocumentTitle', () => ({
    useDocumentTitle: vi.fn()
}));

describe('ClientDetailPage', () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getClientById).mockResolvedValue({
            id: 'client-1',
            name: 'Crayons & Code',
            archivedAt: null,
            createdAt: '2026-07-13T09:00:00.000Z'
        });
        vi.mocked(getProjects).mockResolvedValue({
            data: [
                {
                    id: 'project-1',
                    name: 'Marketing site',
                    url: 'https://example.com',
                    clientId: 'client-1',
                    archivedAt: null,
                    createdAt: '2026-07-13T10:00:00.000Z',
                    summary: {
                        reportCount: 1,
                        reportGroupCount: 1,
                        latestReportCreatedAt: '2026-07-13T11:00:00.000Z',
                        latestReportTitle: 'Homepage mobile',
                        latestScores: null
                    }
                }
            ],
            pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1
            }
        });
    });

    it('loads a client and lists only that client projects', async () => {
        render(
            <MemoryRouter initialEntries={['/clients/client-1']}>
                <Routes>
                    <Route path='/clients/:id' element={<ClientDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole('heading', { name: 'Crayons & Code' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients');
        expect(await screen.findByRole('link', { name: 'Marketing site' })).toHaveAttribute(
            'href',
            '/projects/project-1'
        );
        expect(screen.getByRole('button', { name: 'Edit client' })).toBeInTheDocument();
        await waitFor(() => {
            expect(getClientById).toHaveBeenCalledWith('client-1');
            expect(getProjects).toHaveBeenCalledWith(
                expect.objectContaining({
                    clientId: 'client-1'
                })
            );
        });
    });
});
