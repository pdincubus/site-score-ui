import { useEffect, useId, useRef } from 'react';

type ModalDialogProps = {
    title: string;
    children: React.ReactNode;
    open: boolean;
    onClose: () => void;
};

function ModalDialog({ title, children, open, onClose }: ModalDialogProps) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        const el = dialogRef.current;
        if (!el) {
            return;
        }
        if (open) {
            el.showModal();
        } else {
            el.close();
        }
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className='confirm-dialog modal-dialog'
            aria-labelledby={titleId}
            onClose={onClose}
        >
            <div className='confirm-dialog__content'>
                <div className='modal-dialog__header'>
                    <h2 id={titleId}>{title}</h2>
                    <button
                        type='button'
                        className='modal-dialog__close'
                        aria-label='Close dialog'
                        onClick={() => dialogRef.current?.close()}
                    >
                        ×
                    </button>
                </div>
                <div className='modal-dialog__body'>{children}</div>
            </div>
        </dialog>
    );
}

export { ModalDialog };
