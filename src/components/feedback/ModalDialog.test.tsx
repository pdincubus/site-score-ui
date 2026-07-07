import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ModalDialog } from './ModalDialog';

describe('ModalDialog', () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    it('uses a unique heading id for each mounted dialog', () => {
        render(
            <>
                <ModalDialog title='Create project' open={false} onClose={vi.fn()}>
                    <p>Create form</p>
                </ModalDialog>
                <ModalDialog title='Edit project' open={false} onClose={vi.fn()}>
                    <p>Edit form</p>
                </ModalDialog>
            </>
        );

        const labelledByValues = Array.from(document.querySelectorAll('dialog')).map((dialog) =>
            dialog.getAttribute('aria-labelledby')
        );

        expect(new Set(labelledByValues).size).toBe(2);

        for (const labelledBy of labelledByValues) {
            expect(labelledBy).toBeTruthy();
            expect(document.getElementById(String(labelledBy))).toBeInTheDocument();
        }
    });
});
