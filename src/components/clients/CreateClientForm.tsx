import { useState } from 'react';
import { createClient } from '../../api/clients';
import type { Client } from '../../types/api';
import { Alert } from '../feedback/Alert';
import { CLIENT_NAME_MAX_LENGTH, validateClientForm } from './clientFormValidation';

type CreateClientFormProps = {
    onCreated: (client: Client) => void;
    variant?: 'card' | 'embedded';
};

function CreateClientForm({ onCreated, variant = 'card' }: CreateClientFormProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        const validation = validateClientForm({ name });

        if (!validation.data) {
            setError(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const client = await createClient(validation.data);

            setName('');
            onCreated(client);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create client');
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
                    placeholder='Client name'
                    required
                    maxLength={CLIENT_NAME_MAX_LENGTH}
                />
            </label>

            {error ? (
                <Alert variant='error' title='Could not create client'>
                    {error}
                </Alert>
            ) : null}

            <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creating client...' : 'Create client'}
            </button>
        </form>
    );

    if (variant === 'embedded') {
        return form;
    }

    return (
        <div className='card'>
            <h2>Create client</h2>
            {form}
        </div>
    );
}

export { CreateClientForm };
