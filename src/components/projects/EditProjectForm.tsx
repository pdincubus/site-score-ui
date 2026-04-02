import { useEffect, useRef, useState } from 'react';
import { deleteProject, updateProject } from '../../api/projects';
import { Alert } from '../feedback/Alert';
import {
    ConfirmDialog,
    type ConfirmDialogHandle
} from '../feedback/ConfirmDialog';
import type { Project } from '../../types/api';

type EditProjectFormProps = {
    project: Project;
    onUpdated: (project: Project) => void;
    onDeleted: () => void;
};

function EditProjectForm({ project, onUpdated, onDeleted }: EditProjectFormProps) {
    const confirmDialogRef = useRef<ConfirmDialogHandle | null>(null);

    const [name, setName] = useState(project.name);
    const [url, setUrl] = useState(project.url);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setName(project.name);
        setUrl(project.url);
    }, [project]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const updatedProject = await updateProject(project.id, {
                name,
                url
            });

            onUpdated(updatedProject);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setIsSubmitting(false);
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

    return (
        <div className='card'>
            <h2>Edit project</h2>

            <form onSubmit={handleSubmit} className='form-stack'>
                <label>
                    <span>Name</span>
                    <input
                        type='text'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder='Project name'
                    />
                </label>

                <label>
                    <span>URL</span>
                    <input
                        type='url'
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder='https://example.com'
                    />
                </label>

                {error ? (
                    <Alert variant='error' title='Could not update project'>
                        {error}
                    </Alert>
                ) : null}

                <div className='button-row'>
                    <button type='submit' disabled={isSubmitting || isDeleting}>
                        {isSubmitting ? 'Saving changes...' : 'Save project'}
                    </button>

                    <button
                        type='button'
                        onClick={handleDelete}
                        disabled={isSubmitting || isDeleting}
                    >
                        {isDeleting ? 'Deleting project...' : 'Delete project'}
                    </button>
                </div>
            </form>

            <ConfirmDialog ref={confirmDialogRef} />
        </div>
    );
}

export { EditProjectForm };