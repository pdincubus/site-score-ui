import { useState } from 'react';
import { createProject } from '../../api/projects';
import type { Project } from '../../types/api';
import { Alert } from '../feedback/Alert';
import {
    PROJECT_NAME_MAX_LENGTH,
    PROJECT_URL_MAX_LENGTH,
    PROJECT_URL_PATTERN,
    validateProjectForm
} from './projectFormValidation';

type CreateProjectFormProps = {
    onCreated: (project: Project) => void;
    variant?: 'card' | 'embedded';
};

function CreateProjectForm({ onCreated, variant = 'card' }: CreateProjectFormProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const project = await createProject(validation.data);

            setName('');
            setUrl('');
            onCreated(project);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    }

    const form = (
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
                <Alert variant='error' title='Could not create project'>
                    {error}
                </Alert>
            ) : null}

            <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creating project...' : 'Create project'}
            </button>
        </form>
    );

    if (variant === 'embedded') {
        return form;
    }

    return (
        <div className='card'>
            <h2>Create project</h2>
            {form}
        </div>
    );
}

export { CreateProjectForm };
