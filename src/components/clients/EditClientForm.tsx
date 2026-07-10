import { useEffect, useRef, useState } from 'react';
import {
    archiveClient,
    deleteClient,
    restoreClient,
    updateClient
} from '../../api/clients';
import type { Client } from '../../types/api';
import { Alert } from '../feedback/Alert';
import {
    ConfirmDialog,
    type ConfirmDialogHandle
} from '../feedback/ConfirmDialog';
import { CLIENT_NAME_MAX_LENGTH, validateClientForm } from './clientFormValidation';

type EditClientFormProps = {
    client: Client;
    onUpdated: (client: Client) => void;
    onDeleted: (clientId: string) => void;
    onCancel: () => void;
};

function EditClientForm({
    client,
    onUpdated,
    onDeleted,
    onCancel
}: EditClientFormProps) {
    const confirmDialogRef = useRef<ConfirmDialogHandle | null>(null);

    const [name, setName] = useState(client.name);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isArchived = Boolean(client.archivedAt);
    const isBusy = isSubmitting || isStatusUpdating || isDeleting;

    useEffect(() => {
        setName(client.name);
    }, [client]);

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
            const updatedClient = await updateClient(client.id, validation.data);

            onUpdated(updatedClient);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update client');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleArchiveRestore() {
        const confirmed = await confirmDialogRef.current?.open({
            title: isArchived ? 'Restore client' : 'Archive client',
            message: isArchived
                ? 'This will restore the client to the active clients list.'
                : 'This will move the client out of the active clients list. You can restore it later.',
            confirmLabel: isArchived ? 'Restore client' : 'Archive client',
            cancelLabel: 'Cancel'
        });

        if (!confirmed) {
            return;
        }

        setError('');
        setIsStatusUpdating(true);

        try {
            const updatedClient = isArchived
                ? await restoreClient(client.id)
                : await archiveClient(client.id);

            onUpdated(updatedClient);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update client status');
        } finally {
            setIsStatusUpdating(false);
        }
    }

    async function handleDelete() {
        const confirmed = await confirmDialogRef.current?.open({
            title: 'Delete client',
            message:
                'This will permanently delete the client. Assigned projects will remain but will no longer be assigned to this client.',
            confirmLabel: 'Delete client',
            cancelLabel: 'Keep client',
            variant: 'danger'
        });

        if (!confirmed) {
            return;
        }

        setError('');
        setIsDeleting(true);

        try {
            await deleteClient(client.id);
            onDeleted(client.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete client');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
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
                        disabled={isBusy}
                    />
                </label>

                {error ? (
                    <Alert variant='error' title='Could not update client'>
                        {error}
                    </Alert>
                ) : null}

                <div className='button-row'>
                    <button type='submit' disabled={isBusy}>
                        {isSubmitting ? 'Saving changes...' : 'Save client'}
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
                                ? 'Restore client'
                                : 'Archive client'}
                    </button>

                    <button
                        type='button'
                        className='button-danger'
                        onClick={handleDelete}
                        disabled={isBusy}
                    >
                        {isDeleting ? 'Deleting client...' : 'Delete client'}
                    </button>

                    <button
                        type='button'
                        className='button-secondary'
                        onClick={onCancel}
                        disabled={isBusy}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            <ConfirmDialog ref={confirmDialogRef} />
        </>
    );
}

export { EditClientForm };
