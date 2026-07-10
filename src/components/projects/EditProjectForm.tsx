import { useEffect, useRef, useState } from 'react';
import {
    archiveProject,
    deleteProject,
    restoreProject,
    updateProject
} from '../../api/projects';
import { Alert } from '../feedback/Alert';
import {
    ConfirmDialog,
    type ConfirmDialogHandle
} from '../feedback/ConfirmDialog';
import type { Project } from '../../types/api';
import {
    PROJECT_NAME_MAX_LENGTH,
    PROJECT_URL_MAX_LENGTH,
    PROJECT_URL_PATTERN,
    validateProjectForm
} from './projectFormValidation';

type EditProjectFormProps = {
    project: Project;
    onUpdated: (project: Project) => void;
    onDeleted: () => void;
    variant?: 'card' | 'embedded';
};

function EditProjectForm({
    project,
    onUpdated,
    onDeleted,
    variant = 'card'
}: EditProjectFormProps) {
    const confirmDialogRef = useRef<ConfirmDialogHandle | null>(null);

    const [name, setName] = useState(project.name);
    const [url, setUrl] = useState(project.url);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isArchived = Boolean(project.archivedAt);
    const isBusy = isSubmitting || isStatusUpdating || isDeleting;

    useEffect(() => {
        setName(project.name);
        setUrl(project.url);
    }, [project]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        const validation = validateProjectForm({
            name,
            url
        });

        if (!validation.data) {
            setError(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const updatedProject = await updateProject(project.id, validation.data);

            onUpdated(updatedProject);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleArchiveRestore() {
        const confirmed = await confirmDialogRef.current?.open({
            title: isArchived ? 'Restore project' : 'Archive project',
            message: isArchived
                ? 'This will restore the project to the active projects list.'
                : 'This will move the project out of the active projects list. You can restore it later.',
            confirmLabel: isArchived ? 'Restore project' : 'Archive project',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) {
            return;
        }

        setError('');
        setIsStatusUpdating(true);

        try {
            const updatedProject = isArchived
                ? await restoreProject(project.id)
                : await archiveProject(project.id);

            onUpdated(updatedProject);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project status');
        } finally {
            setIsStatusUpdating(false);
        }
    }

    async function handleDelete() {
        const confirmed = await confirmDialogRef.current?.open({
            title: 'Delete project',
            message: 'This will permanently delete the project and all of its reports.',
            confirmLabel: 'Delete project',
            cancelLabel: 'Keep project',
            variant: 'danger'
        });

        if (!confirmed) {
            return;
        }

        setError('');
        setIsDeleting(true);

        try {
            await deleteProject(project.id);
            onDeleted();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    }

    const form = (
        <>
            <form onSubmit={handleSubmit} className='form-stack'>
                <label>
                    <span>Name</span>
                    <input
                        type='text'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder='Project name'
                        required
                        maxLength={PROJECT_NAME_MAX_LENGTH}
                    />
                </label>

                <label>
                    <span>URL</span>
                    <input
                        type='url'
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder='https://example.com'
                        required
                        maxLength={PROJECT_URL_MAX_LENGTH}
                        pattern={PROJECT_URL_PATTERN}
                    />
                </label>

                {error ? (
                    <Alert variant='error' title='Could not update project'>
                        {error}
                    </Alert>
                ) : null}

                <div className='button-row'>
                    <button type='submit' disabled={isBusy}>
                        {isSubmitting ? 'Saving changes...' : 'Save project'}
                    </button>

                    <button
                        type='button'
                        className='button-secondary'
                        onClick={handleArchiveRestore}
                        disabled={isBusy}
                    >
                        {isStatusUpdating
                            ? 'Updating status...'
                            : isArchived
                                ? 'Restore project'
                                : 'Archive project'}
                    </button>

                    <button
                        type='button'
                        className='button-danger'
                        onClick={handleDelete}
                        disabled={isBusy}
                    >
                        {isDeleting ? 'Deleting project...' : 'Delete project'}
                    </button>
                </div>
            </form>

            <ConfirmDialog ref={confirmDialogRef} />
        </>
    );

    if (variant === 'embedded') {
        return form;
    }

    return (
        <div className='card'>
            <h2>Edit project</h2>
            {form}
        </div>
    );
}

export { EditProjectForm };
