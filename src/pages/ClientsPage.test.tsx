import { render, screen, within } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getClients } from '../api/clients';
import { ClientsPage } from './ClientsPage';
import type { Client, PaginatedResponse } from '../types/api';

vi.mock('../api/clients', () => ({
    ORDER_OPTIONS: ['asc', 'desc'],
    STATUS_OPTIONS: ['active', 'archived', 'all'],
    getClients: vi.fn()
}));

vi.mock('../hooks/useDocumentTitle', () => ({
    useDocumentTitle: vi.fn()
}));

function clientResponse(data: Client[]): PaginatedResponse<Client> {
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

function renderClientsPage(initialPath = '/clients') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <ClientsPage />
        </MemoryRouter>
    );
}

describe('ClientsPage', () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a friendly loading state while clients load', () => {
        vi.mocked(getClients).mockImplementation(() => new Promise(() => undefined));

        renderClientsPage();

        expect(screen.getByRole('status')).toHaveTextContent('Checking your clients');
        expect(
            screen.getByText(
                'If the API has been idle, your client list can take a few seconds to wake up.'
            )
        ).toBeInTheDocument();
    });

    it('requests and labels archived clients when the archive view is selected', async () => {
        vi.mocked(getClients).mockResolvedValue(
            clientResponse([
                {
                    id: 'client-archived',
                    name: 'Archived client',
                    archivedAt: '2026-07-09T08:30:00.000Z',
                    createdAt: '2026-07-01T08:30:00.000Z'
                }
            ])
        );

        renderClientsPage('/clients?status=archived');

        const clientHeading = await screen.findByRole('heading', { name: 'Archived client' });
        const clientCard = clientHeading.closest('li');

        expect(getClients).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'archived'
            })
        );
        expect(clientCard).not.toBeNull();
        expect(within(clientCard as HTMLElement).getByRole('link', { name: 'Archived client' })).toHaveAttribute(
            'href',
            '/clients/client-archived'
        );
        expect(within(clientCard as HTMLElement).getAllByText('Archived').length).toBeGreaterThan(0);
    });
});
