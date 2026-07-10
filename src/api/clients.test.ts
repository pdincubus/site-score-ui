import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    archiveClient,
    createClient,
    deleteClient,
    getClientById,
    getClients,
    restoreClient,
    updateClient
} from './clients';
import { setOnUnauthorized } from './client';

function mockPaginatedResponse() {
    return new Response(
        JSON.stringify({
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        }),
        {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }
    );
}

describe('client API helpers', () => {
    afterEach(() => {
        setOnUnauthorized(null);
        vi.restoreAllMocks();
    });

    it('builds client list requests with pagination, sort and status filters', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockPaginatedResponse());

        await getClients({
            page: 0,
            limit: 5000,
            search: 'Crayons',
            sort: 'not-a-sort' as 'createdAt',
            order: 'sideways' as 'asc',
            status: 'archived'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/clients?page=1&limit=50&search=Crayons&sort=createdAt&order=desc&status=archived'
        );
    });

    it('encodes client ids when building single-client paths', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'client/one',
                    name: 'Client One',
                    archivedAt: null,
                    createdAt: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await getClientById('client/one');

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/clients/client%2Fone');
    });

    it('serialises create and update client payloads', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        id: 'client-one',
                        name: 'Crayons & Code',
                        archivedAt: null,
                        createdAt: '2026-01-01T00:00:00.000Z'
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }
                )
            )
        );

        await createClient({ name: 'Crayons & Code' });
        await updateClient('client/one', { name: 'Updated client' });

        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/clients');
        expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ name: 'Crayons & Code' })
        });
        expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('/clients/client%2Fone');
        expect(fetchSpy.mock.calls[1]?.[1]).toMatchObject({
            method: 'PATCH',
            body: JSON.stringify({ name: 'Updated client' })
        });
    });

    it('encodes client ids for archive, restore and delete actions', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        id: 'client/one',
                        name: 'Client One',
                        archivedAt: '2026-07-10T10:00:00.000Z',
                        createdAt: '2026-01-01T00:00:00.000Z'
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }
                )
            )
        );

        await archiveClient('client/one');
        await restoreClient('client/one');
        await deleteClient('client/one');

        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/clients/client%2Fone/archive');
        expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('/clients/client%2Fone/restore');
        expect(fetchSpy.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[2]?.[0])).toContain('/clients/client%2Fone');
        expect(fetchSpy.mock.calls[2]?.[1]).toMatchObject({ method: 'DELETE' });
    });
});
