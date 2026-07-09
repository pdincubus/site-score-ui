import { useEffect, useRef, useState } from 'react';
import { deleteReport, updateReport } from '../../api/projects';
import type { Report, ReportGroup } from '../../types/api';
import { Alert } from '../feedback/Alert';
import {
    ConfirmDialog,
    type ConfirmDialogHandle
} from '../feedback/ConfirmDialog';
import {
    REPORT_PAGE_URL_MAX_LENGTH,
    REPORT_SUMMARY_MAX_LENGTH,
    REPORT_TITLE_MAX_LENGTH,
    SCORE_MAX,
    SCORE_MIN,
    validateReportForm
} from './reportFormValidation';

type EditReportFormProps = {
    report: Report;
    groups?: ReportGroup[];
    onUpdated: (report: Report) => void;
    onDeleted: (reportId: string) => void;
    onCancel: () => void;
};

function EditReportForm({
    report,
    groups = [],
    onUpdated,
    onDeleted,
    onCancel
}: EditReportFormProps) {
    const confirmDialogRef = useRef<ConfirmDialogHandle | null>(null);

    const [groupId, setGroupId] = useState(report.groupId || '');
    const [title, setTitle] = useState(report.title);
    const [summary, setSummary] = useState(report.summary);
    const [pageUrl, setPageUrl] = useState(report.pageUrl);
    const [performanceScore, setPerformanceScore] = useState(String(report.performanceScore));
    const [accessibilityScore, setAccessibilityScore] = useState(String(report.accessibilityScore));
    const [seoScore, setSeoScore] = useState(String(report.seoScore));
    const [bestPracticesScore, setBestPracticesScore] = useState(String(report.bestPracticesScore));
    const [agenticBrowsingScore, setAgenticBrowsingScore] = useState(String(report.agenticBrowsingScore));
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setGroupId(report.groupId || '');
        setTitle(report.title);
        setSummary(report.summary);
        setPageUrl(report.pageUrl);
        setPerformanceScore(String(report.performanceScore));
        setAccessibilityScore(String(report.accessibilityScore));
        setSeoScore(String(report.seoScore));
        setBestPracticesScore(String(report.bestPracticesScore));
        setAgenticBrowsingScore(String(report.agenticBrowsingScore));
    }, [report]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        const validation = validateReportForm({
            groupId,
            title,
            summary,
            pageUrl,
            performanceScore,
            accessibilityScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore
        });

        if (!validation.data) {
            setError(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const updatedReport = await updateReport(report.id, validation.data);

            onUpdated(updatedReport);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update report');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleGroupChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextGroupId = event.target.value;
        const nextGroup = groups.find((group) => group.id === nextGroupId);

        setGroupId(nextGroupId);

        if (nextGroup) {
            setPageUrl(nextGroup.pageUrl);
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
                    <span>Report group</span>
                    <select
                        value={groupId}
                        onChange={handleGroupChange}
                        required
                        disabled={isSubmitting || isDeleting}
                    >
                        <option value=''>Choose a report group</option>
                        {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    <span>Title</span>
                    <input
                        type='text'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                        maxLength={REPORT_TITLE_MAX_LENGTH}
                    />
                </label>

                <label>
                    <span>Summary</span>
                    <input
                        type='text'
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        required
                        maxLength={REPORT_SUMMARY_MAX_LENGTH}
                    />
                </label>

                <label>
                    <span>Page URL</span>
                    <input
                        type='url'
                        value={pageUrl}
                        onChange={(event) => setPageUrl(event.target.value)}
                        required
                        maxLength={REPORT_PAGE_URL_MAX_LENGTH}
                    />
                </label>

                <div className='score-form-grid'>
                    <label>
                        <span>Performance</span>
                        <input
                            type='number'
                            min={SCORE_MIN}
                            max={SCORE_MAX}
                            step='1'
                            value={performanceScore}
                            onChange={(event) => setPerformanceScore(event.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span>Accessibility</span>
                        <input
                            type='number'
                            min={SCORE_MIN}
                            max={SCORE_MAX}
                            step='1'
                            value={accessibilityScore}
                            onChange={(event) => setAccessibilityScore(event.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span>SEO</span>
                        <input
                            type='number'
                            min={SCORE_MIN}
                            max={SCORE_MAX}
                            step='1'
                            value={seoScore}
                            onChange={(event) => setSeoScore(event.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span>Best practices</span>
                        <input
                            type='number'
                            min={SCORE_MIN}
                            max={SCORE_MAX}
                            step='1'
                            value={bestPracticesScore}
                            onChange={(event) => setBestPracticesScore(event.target.value)}
                            required
                        />
                    </label>

                    <label>
                        <span>Agentic browsing</span>
                        <input
                            type='number'
                            min={SCORE_MIN}
                            max={SCORE_MAX}
                            step='1'
                            value={agenticBrowsingScore}
                            onChange={(event) => setAgenticBrowsingScore(event.target.value)}
                            required
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
