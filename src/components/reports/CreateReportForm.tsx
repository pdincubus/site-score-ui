import { useState } from 'react';
import { createReport } from '../../api/projects';
import type { Report } from '../../types/api';
import { Alert } from '../feedback/Alert';
import {
    REPORT_SUMMARY_MAX_LENGTH,
    REPORT_TITLE_MAX_LENGTH,
    SCORE_MAX,
    SCORE_MIN,
    validateReportForm
} from './reportFormValidation';

type CreateReportFormProps = {
    projectId: string;
    onCreated: (report: Report) => void;
    variant?: 'card' | 'embedded';
};

function CreateReportForm({
    projectId,
    onCreated,
    variant = 'card'
}: CreateReportFormProps) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [accessibilityScore, setAccessibilityScore] = useState('80');
    const [performanceScore, setPerformanceScore] = useState('80');
    const [seoScore, setSeoScore] = useState('80');
    const [uxScore, setUxScore] = useState('80');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        const validation = validateReportForm({
            title,
            summary,
            accessibilityScore,
            performanceScore,
            seoScore,
            uxScore
        });

        if (!validation.data) {
            setError(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            const report = await createReport(projectId, validation.data);

            setTitle('');
            setSummary('');
            setAccessibilityScore('80');
            setPerformanceScore('80');
            setSeoScore('80');
            setUxScore('80');

            onCreated(report);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create report');
        } finally {
            setIsSubmitting(false);
        }
    }

    const form = (
        <form onSubmit={handleSubmit} className='form-stack'>
            <label>
                <span>Title</span>
                <input
                    type='text'
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder='Homepage audit'
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
                    placeholder='Short summary'
                    required
                    maxLength={REPORT_SUMMARY_MAX_LENGTH}
                />
            </label>

            <div className='score-form-grid'>
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
                    <span>UX</span>
                    <input
                        type='number'
                        min={SCORE_MIN}
                        max={SCORE_MAX}
                        step='1'
                        value={uxScore}
                        onChange={(event) => setUxScore(event.target.value)}
                        required
                    />
                </label>
            </div>

            {error ? (
                <Alert variant='error' title='Could not create report'>
                    {error}
                </Alert>
            ) : null}

            <button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creating report...' : 'Create report'}
            </button>
        </form>
    );

    if (variant === 'embedded') {
        return form;
    }

    return (
        <div className='card'>
            <h2>Create report</h2>
            {form}
        </div>
    );
}

export { CreateReportForm };
