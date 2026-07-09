import { useState } from 'react';
import { importReportInsights } from '../../api/projects';
import type { PageSpeedStrategy, ReportInsights } from '../../types/api';
import { Alert } from '../feedback/Alert';
import { validateReportPageUrl } from './reportFormValidation';

type ImportedScores = {
    performanceScore?: string;
    accessibilityScore?: string;
    seoScore?: string;
    bestPracticesScore?: string;
    agenticBrowsingScore?: string;
};

type PageSpeedImportControlsProps = {
    projectId: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    onImported: (insights: ReportInsights) => void;
    onScoresImported: (scores: ImportedScores) => void;
    disabled?: boolean;
};

function normaliseImportedScore(score: number | null) {
    if (
        score === null ||
        !Number.isFinite(score) ||
        !Number.isInteger(score) ||
        score < 0 ||
        score > 100
    ) {
        return undefined;
    }

    return String(score);
}

function getImportedScores(insights: ReportInsights): ImportedScores {
    return {
        performanceScore: normaliseImportedScore(insights.scores.performance),
        accessibilityScore: normaliseImportedScore(insights.scores.accessibility),
        seoScore: normaliseImportedScore(insights.scores.seo),
        bestPracticesScore: normaliseImportedScore(insights.scores.bestPractices),
        agenticBrowsingScore: normaliseImportedScore(insights.scores.agenticBrowsing)
    };
}

function PageSpeedImportControls({
    projectId,
    pageUrl,
    strategy,
    onImported,
    onScoresImported,
    disabled = false
}: PageSpeedImportControlsProps) {
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    async function handleImport() {
        setError('');

        const validation = validateReportPageUrl(pageUrl);

        if (!validation.url) {
            setError(validation.error);
            return;
        }

        setIsImporting(true);

        try {
            const importedInsights = await importReportInsights(projectId, {
                source: 'PAGESPEED',
                url: validation.url,
                strategy
            });

            onImported(importedInsights);
            onScoresImported(getImportedScores(importedInsights));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import PageSpeed data');
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <fieldset className='page-speed-import'>
            <legend>PageSpeed import</legend>

            <div className='page-speed-import__controls'>
                <dl className='page-speed-import__target'>
                    <div>
                        <dt>Import target</dt>
                        <dd>{pageUrl.trim() || 'Not set'}</dd>
                    </div>
                </dl>

                <button type='button' onClick={handleImport} disabled={disabled || isImporting}>
                    {isImporting ? 'Importing...' : 'Import PageSpeed data'}
                </button>
            </div>

            {error ? (
                <Alert variant='error' title='Could not import PageSpeed data'>
                    {error}
                </Alert>
            ) : null}

        </fieldset>
    );
}

export { PageSpeedImportControls };
