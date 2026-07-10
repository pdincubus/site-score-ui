import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveProject, deleteProject, restoreProject, updateProject } from '../../api/projects';
import { EditProjectForm } from './EditProjectForm';
import type { Project } from '../../types/api';

vi.mock('../../api/projects', () => ({
    archiveProject: vi.fn(),
    deleteProject: vi.fn(),
    restoreProject: vi.fn(),
    updateProject: vi.fn()
}));

const project: Project = {
    id: 'project-1',
    name: 'Original name',
    url: 'https://example.com',
    clientId: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z'
};

describe('EditProjectForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('trims project values before updating a project', async () => {
        const onUpdated = vi.fn();
        vi.mocked(updateProject).mockResolvedValue({
            ...project,
            name: 'Updated name',
            url: 'https://updated.example.com'
        });

        render(
            <EditProjectForm
                project={project}
                onUpdated={onUpdated}
                onDeleted={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: '  Updated name  ' }
        });
        fireEvent.change(screen.getByLabelText('URL'), {
            target: { value: '  https://updated.example.com  ' }
        });
        fireEvent.submit(screen.getByLabelText('Name').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(updateProject).toHaveBeenCalledWith('project-1', {
                name: 'Updated name',
                url: 'https://updated.example.com'
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects invalid project URLs before calling the API', async () => {
        render(
            <EditProjectForm
                project={project}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('URL'), {
            target: { value: 'ftp://example.com' }
        });
        fireEvent.submit(screen.getByLabelText('Name').closest('form') as HTMLFormElement);

        expect(
            await screen.findByText('Enter a project URL starting with http:// or https://.')
        ).toBeInTheDocument();
        expect(updateProject).not.toHaveBeenCalled();
        expect(archiveProject).not.toHaveBeenCalled();
        expect(restoreProject).not.toHaveBeenCalled();
        expect(deleteProject).not.toHaveBeenCalled();
    });

    it('shows archive controls for active projects and restore controls for archived projects', () => {
        const { rerender } = render(
            <EditProjectForm
                project={project}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Archive project' })).toBeInTheDocument();

        rerender(
            <EditProjectForm
                project={{
                    ...project,
                    archivedAt: '2026-07-10T09:00:00.000Z'
                }}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Restore project' })).toBeInTheDocument();
    });
});
