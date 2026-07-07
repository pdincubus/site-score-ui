import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject } from '../../api/projects';
import { CreateProjectForm } from './CreateProjectForm';

vi.mock('../../api/projects', () => ({
    createProject: vi.fn()
}));

describe('CreateProjectForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds browser validation attributes for required project fields', () => {
        render(<CreateProjectForm onCreated={vi.fn()} />);

        expect(screen.getByLabelText('Name')).toBeRequired();
        expect(screen.getByLabelText('Name')).toHaveAttribute('maxlength', '120');
        expect(screen.getByLabelText('URL')).toBeRequired();
        expect(screen.getByLabelText('URL')).toHaveAttribute('maxlength', '2048');
        expect(screen.getByLabelText('URL')).toHaveAttribute('pattern', 'https?://.+');
    });

    it('trims project values before creating a project', async () => {
        const onCreated = vi.fn();
        vi.mocked(createProject).mockResolvedValue({
            id: 'project-1',
            name: 'Client site',
            url: 'https://example.com',
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(<CreateProjectForm onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: '  Client site  ' }
        });
        fireEvent.change(screen.getByLabelText('URL'), {
            target: { value: '  https://example.com  ' }
        });
        fireEvent.submit(screen.getByLabelText('Name').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createProject).toHaveBeenCalledWith({
                name: 'Client site',
                url: 'https://example.com'
            });
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects whitespace-only project names before calling the API', async () => {
        render(<CreateProjectForm onCreated={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Name'), {
            target: { value: '   ' }
        });
        fireEvent.change(screen.getByLabelText('URL'), {
            target: { value: 'https://example.com' }
        });
        fireEvent.submit(screen.getByLabelText('Name').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Enter a project name.')).toBeInTheDocument();
        expect(createProject).not.toHaveBeenCalled();
    });
});
