import { useState } from 'react';
import { createProject } from '../../api/projects';
import type { Project } from '../../types/api';
import { Alert } from '../feedback/Alert';

type CreateProjectFormProps = {
    onCreated: (project: Project) => void;
};

function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const project = await createProject({
                name,
                url
            });

            setName('');
            setUrl('');
            onCreated(project);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='card'>
            <h2>Create project</h2>

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
    <Alert variant='error' title='Could not create project'>
        {error}
    </Alert>
) : null}

                <button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Creating project...' : 'Create project'}
                </button>
            </form>
        </div>
    );
}

export { CreateProjectForm };