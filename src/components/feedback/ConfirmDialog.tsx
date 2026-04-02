import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

type ConfirmDialogOptions = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
};

export type ConfirmDialogHandle = {
    open: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialog = forwardRef<ConfirmDialogHandle>(function ConfirmDialog(_, ref) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);

    const [title, setTitle] = useState('Confirm action');
    const [message, setMessage] = useState('Are you sure?');
    const [confirmLabel, setConfirmLabel] = useState('Confirm');
    const [cancelLabel, setCancelLabel] = useState('Cancel');
    const [variant, setVariant] = useState<'default' | 'danger'>('default');

    useImperativeHandle(ref, () => ({
        open(options: ConfirmDialogOptions) {
            setTitle(options.title);
            setMessage(options.message);
            setConfirmLabel(options.confirmLabel || 'Confirm');
            setCancelLabel(options.cancelLabel || 'Cancel');
            setVariant(options.variant || 'default');

            return new Promise<boolean>((resolve) => {
                resolverRef.current = resolve;
                dialogRef.current?.showModal();
            });
        }
    }));

    function closeWith(result: boolean) {
        resolverRef.current?.(result);
        resolverRef.current = null;
        dialogRef.current?.close();
    }

    return (
        <dialog
            ref={dialogRef}
            className='confirm-dialog'
            onCancel={() => closeWith(false)}
        >
            <div className='confirm-dialog__content'>
                <h2>{title}</h2>
                <p>{message}</p>

                <div className='confirm-dialog__actions'>
                    <button
                        type='button'
                        onClick={() => closeWith(false)}
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type='button'
                        className={variant === 'danger' ? 'button-danger' : ''}
                        onClick={() => closeWith(true)}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    );
});

export { ConfirmDialog };