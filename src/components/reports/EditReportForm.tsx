import { useEffect, useRef, useState } from 'react';
import { deleteReport, updateReport } from '../../api/projects';
import type { Report } from '../../types/api';
import { Alert } from '../feedback/Alert';
import {
    ConfirmDialog,
    type ConfirmDialogHandle
} from '../feedback/ConfirmDialog';

type EditReportFormProps = {
    report: Report;
    onUpdated: (report: Report) => void;
    onDeleted: (reportId: string) => void;
    onCancel: () => void;
};

function EditReportForm({ report, onUpdated, onDeleted, onCancel }: EditReportFormProps) {
    const confirmDialogRef = useRef<ConfirmDialogHandle | null>(null);

    const [title, setTitle] = useState(report.title);
    const [summary, setSummary] = useState(report.summary);
    const [accessibilityScore, setAccessibilityScore] = useState(String(report.accessibilityScore));
    const [performanceScore, setPerformanceScore] = useState(String(report.performanceScore));
    const [seoScore, setSeoScore] = useState(String(report.seoScore));
    const [uxScore, setUxScore] = useState(String(report.uxScore));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setTitle(report.title);
        setSummary(report.summary);
        setAccessibilityScore(String(report.accessibilityScore));
        setPerformanceScore(String(report.performanceScore));
        setSeoScore(String(report.seoScore));
        setUxScore(String(report.uxScore));
    }, [report]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const updatedReport = await updateReport(report.id, {
                title,
                summary,
                accessibilityScore: Number(accessibilityScore),
                performanceScore: Number(performanceScore),
                seoScore: Number(seoScore),
                uxScore: Number(uxScore)
            });

            onUpdated(updatedReport);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update report');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        const confirmed = await confirmDialogRef.current?.open({
            title: 'Delete report',
            message: 'This report will be permanently deleted.',
            confirmLabel: 'Delete report',
            cancelLabel: 'Keep report',
            variant: 'danger'
        });

        if (!confirmed) {
            return;
        }

        setError('');
        setIsDeleting(true);

        try {
            await deleteReport(report.id);
            onDeleted(report.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete report');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className='form-stack'>
                <label>
                    <span>Title</span>
                    <input
                        type='text'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                </label>

                <label>
                    <span>Summary</span>
                    <input
                        type='text'
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                    />
                </label>

                <div className='score-form-grid'>
                    <label>
                        <span>Accessibility</span>
                        <input
                            type='number'
                            min='0'
                            max='100'
                            value={accessibilityScore}
                            onChange={(event) => setAccessibilityScore(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>Performance</span>
                        <input
                            type='number'
                            min='0'
                            max='100'
                            value={performanceScore}
                            onChange={(event) => setPerformanceScore(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>SEO</span>
                        <input
                            type='number'
                            min='0'
                            max='100'
                            value={seoScore}
                            onChange={(event) => setSeoScore(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>UX</span>
                        <input
                            type='number'
                            min='0'
                            max='100'
                            value={uxScore}
                            onChange={(event) => setUxScore(event.target.value)}
                        />
                    </label>
                </div>

                {error ? (
                    <Alert variant='error' title='Could not update report'>
                        {error}
                    </Alert>
                ) : null}

                <div className='button-row'>
                    <button type='submit' disabled={isSubmitting || isDeleting}>
                        {isSubmitting ? 'Saving changes...' : 'Save report'}
                    </button>

                    <button
                        type='button'
                        onClick={handleDelete}
                        disabled={isSubmitting || isDeleting}
                    >
                        {isDeleting ? 'Deleting report...' : 'Delete report'}
                    </button>

                    <button
                        type='button'
                        onClick={onCancel}
                        disabled={isSubmitting || isDeleting}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            <ConfirmDialog ref={confirmDialogRef} />
        </>
    );
}

export { EditReportForm };