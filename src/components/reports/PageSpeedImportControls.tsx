import { useEffect, useState } from 'react';
import { importReportInsights } from '../../api/projects';
import type { PageSpeedStrategy, ReportInsights } from '../../types/api';
import { Alert } from '../feedback/Alert';
import { ReportInsightsSummary } from './ReportInsightsSummary';

const PAGE_SPEED_URL_MAX_LENGTH = 2048;

type ImportedScores = {
    accessibilityScore?: string;
    performanceScore?: string;
    seoScore?: string;
};

type PageSpeedImportControlsProps = {
    projectId: string;
    defaultUrl: string;
    insights: ReportInsights | null;
    onImported: (insights: ReportInsights) => void;
    onScoresImported: (scores: ImportedScores) => void;
    disabled?: boolean;
};

type UrlValidationResult =
    | {
          url: string;
          error: '';
      }
    | {
          url: null;
          error: string;
      };

function validatePageSpeedUrl(value: string): UrlValidationResult {
    const url = value.trim();

    if (!url) {
        return {
            url: null,
            error: 'Enter a page URL before importing PageSpeed data.'
        };
    }

    if (url.length > PAGE_SPEED_URL_MAX_LENGTH) {
        return {
            url: null,
            error: `Page URL must be ${PAGE_SPEED_URL_MAX_LENGTH} characters or fewer.`
        };
    }

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return {
                url: null,
                error: 'Page URL must start with http:// or https://.'
            };
        }
    } catch {
        return {
            url: null,
            error: 'Enter a valid page URL.'
        };
    }

    return {
        url,
        error: ''
    };
}

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
        accessibilityScore: normaliseImportedScore(insights.scores.accessibility),
        performanceScore: normaliseImportedScore(insights.scores.performance),
        seoScore: normaliseImportedScore(insights.scores.seo)
    };
}

function PageSpeedImportControls({
    projectId,
    defaultUrl,
    insights,
    onImported,
    onScoresImported,
    disabled = false
}: PageSpeedImportControlsProps) {
    const [pageUrl, setPageUrl] = useState(insights?.testedUrl || defaultUrl);
    const [strategy, setStrategy] = useState<PageSpeedStrategy>(insights?.strategy || 'mobile');
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        setPageUrl(insights?.testedUrl || defaultUrl);
        setStrategy(insights?.strategy || 'mobile');
    }, [defaultUrl, insights?.strategy, insights?.testedUrl]);

    async function handleImport() {
        setError('');

        const validation = validatePageSpeedUrl(pageUrl);

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
                <label>
                    <span>Page URL</span>
                    <input
                        type='url'
                        value={pageUrl}
                        onChange={(event) => setPageUrl(event.target.value)}
                        placeholder='https://example.com/'
                        maxLength={PAGE_SPEED_URL_MAX_LENGTH}
                        disabled={disabled || isImporting}
                    />
                </label>

                <label>
                    <span>Strategy</span>
                    <select
                        value={strategy}
                        onChange={(event) => setStrategy(event.target.value as PageSpeedStrategy)}
                        disabled={disabled || isImporting}
                    >
                        <option value='mobile'>Mobile</option>
                        <option value='desktop'>Desktop</option>
                    </select>
                </label>

                <button type='button' onClick={handleImport} disabled={disabled || isImporting}>
                    {isImporting ? 'Importing...' : 'Import PageSpeed data'}
                </button>
            </div>

            {error ? (
                <Alert variant='error' title='Could not import PageSpeed data'>
                    {error}
                </Alert>
            ) : null}

            {insights ? <ReportInsightsSummary insights={insights} /> : null}
        </fieldset>
    );
}

export { PageSpeedImportControls };
