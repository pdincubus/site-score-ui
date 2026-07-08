import { useState } from 'react';
import { createReport, createReportGroup } from '../../api/projects';
import { isPageSpeedImportEnabled } from '../../config/features';
import type { PageSpeedStrategy, Report, ReportGroup, ReportInsights } from '../../types/api';
import { Alert } from '../feedback/Alert';
import { PageSpeedImportControls } from './PageSpeedImportControls';
import { ReportInsightsSummary } from './ReportInsightsSummary';
import { normaliseReportInsights } from './reportInsightsNormalisation';
import {
    REPORT_GROUP_NAME_MAX_LENGTH,
    REPORT_PAGE_URL_MAX_LENGTH,
    REPORT_SUMMARY_MAX_LENGTH,
    REPORT_TITLE_MAX_LENGTH,
    SCORE_MAX,
    SCORE_MIN,
    validateReportForm,
    validateReportGroupForm
} from './reportFormValidation';

const NEW_GROUP_VALUE = '__new__';

type CreateReportFormProps = {
    projectId: string;
    groups?: ReportGroup[];
    defaultReportGroupId?: string;
    defaultPageSpeedUrl?: string;
    onCreated: (report: Report) => void;
    onGroupCreated?: (group: ReportGroup) => void;
    variant?: 'card' | 'embedded';
};

function getInitialGroup(groups: ReportGroup[], defaultReportGroupId?: string) {
    return (
        groups.find((group) => group.id === defaultReportGroupId) ||
        groups[0] ||
        null
    );
}

function CreateReportForm({
    projectId,
    groups = [],
    defaultReportGroupId,
    defaultPageSpeedUrl = '',
    onCreated,
    onGroupCreated,
    variant = 'card'
}: CreateReportFormProps) {
    const initialGroup = getInitialGroup(groups, defaultReportGroupId);

    const [isCreatingGroup, setIsCreatingGroup] = useState(!initialGroup);
    const [selectedGroupId, setSelectedGroupId] = useState(initialGroup?.id || '');
    const [groupName, setGroupName] = useState('');
    const [groupPageUrl, setGroupPageUrl] = useState(initialGroup?.pageUrl || defaultPageSpeedUrl);
    const [groupStrategy, setGroupStrategy] = useState<PageSpeedStrategy>(
        initialGroup?.strategy || 'mobile'
    );
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [pageUrl, setPageUrl] = useState(initialGroup?.pageUrl || defaultPageSpeedUrl);
    const [pageSpeedStrategy, setPageSpeedStrategy] = useState<PageSpeedStrategy>(
        initialGroup?.strategy || 'mobile'
    );
    const [performanceScore, setPerformanceScore] = useState('80');
    const [accessibilityScore, setAccessibilityScore] = useState('80');
    const [seoScore, setSeoScore] = useState('80');
    const [bestPracticesScore, setBestPracticesScore] = useState('80');
    const [agenticBrowsingScore, setAgenticBrowsingScore] = useState('80');
    const [insights, setInsights] = useState<ReportInsights | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pageSpeedImportEnabled = isPageSpeedImportEnabled();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        let nextGroupId = selectedGroupId.trim();
        let nextGroup: ReportGroup | null = null;
        const groupValidation = isCreatingGroup
            ? validateReportGroupForm({
                  name: groupName,
                  pageUrl: groupPageUrl,
                  strategy: groupStrategy
              })
            : null;

        if (isCreatingGroup && !groupValidation?.data) {
            setError(groupValidation?.error || 'Could not validate report group.');
            return;
        }

        if (!isCreatingGroup && !nextGroupId) {
            setError('Choose a report group.');
            return;
        }

        const normalisedInsights = insights
            ? normaliseReportInsights(insights, pageUrl, pageSpeedStrategy)
            : null;
        const validation = validateReportForm({
            groupId: isCreatingGroup ? undefined : nextGroupId,
            title,
            summary,
            pageUrl,
            performanceScore,
            accessibilityScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore,
            insights: normalisedInsights
        });

        if (!validation.data) {
            setError(validation.error);
            return;
        }

        setIsSubmitting(true);

        try {
            if (groupValidation?.data) {
                nextGroup = await createReportGroup(projectId, groupValidation.data);
                nextGroupId = nextGroup.id;

                if (!nextGroupId) {
                    throw new Error(
                        'The report group was created without an id. Refresh and try again.'
                    );
                }

                onGroupCreated?.(nextGroup);
            }

            const report = await createReport(projectId, {
                ...validation.data,
                groupId: nextGroupId
            });

            setTitle('');
            setSummary('');
            setIsCreatingGroup(!nextGroup && groups.length === 0);
            setSelectedGroupId(nextGroup?.id || selectedGroupId);
            setGroupName('');
            setGroupPageUrl(nextGroup?.pageUrl || groupPageUrl);
            setGroupStrategy(nextGroup?.strategy || groupStrategy);
            setPageUrl(nextGroup?.pageUrl || groupPageUrl || defaultPageSpeedUrl);
            setPageSpeedStrategy(nextGroup?.strategy || groupStrategy);
            setPerformanceScore('80');
            setAccessibilityScore('80');
            setSeoScore('80');
            setBestPracticesScore('80');
            setAgenticBrowsingScore('80');
            setInsights(null);

            onCreated(report);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create report');
        } finally {
            setIsSubmitting(false);
        }
    }

    function clearInsightsForPageUrl(nextPageUrl: string) {
        if (insights && nextPageUrl.trim() !== insights.testedUrl) {
            setInsights(null);
        }
    }

    function applyGroupDefaults(group: ReportGroup) {
        setPageUrl(group.pageUrl);
        setPageSpeedStrategy(group.strategy);
        clearInsightsForPageUrl(group.pageUrl);
    }

    function handleGroupSelectionChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const value = event.target.value;

        if (value === NEW_GROUP_VALUE) {
            setIsCreatingGroup(true);
            setSelectedGroupId('');
            setGroupPageUrl(pageUrl || defaultPageSpeedUrl);
            return;
        }

        setIsCreatingGroup(false);
        setSelectedGroupId(value);

        const group = groups.find((item) => item.id === value);

        if (group) {
            applyGroupDefaults(group);
        }
    }

    function handleGroupPageUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextPageUrl = event.target.value;

        setGroupPageUrl(nextPageUrl);
        setPageUrl(nextPageUrl);
        clearInsightsForPageUrl(nextPageUrl);
    }

    function handleGroupStrategyChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextStrategy = event.target.value as PageSpeedStrategy;

        setGroupStrategy(nextStrategy);
        setPageSpeedStrategy(nextStrategy);
    }

    function handleScoresImported(scores: {
        performanceScore?: string;
        accessibilityScore?: string;
        seoScore?: string;
        bestPracticesScore?: string;
        agenticBrowsingScore?: string;
    }) {
        if (scores.performanceScore !== undefined) {
            setPerformanceScore(scores.performanceScore);
        }

        if (scores.accessibilityScore !== undefined) {
            setAccessibilityScore(scores.accessibilityScore);
        }

        if (scores.seoScore !== undefined) {
            setSeoScore(scores.seoScore);
        }

        if (scores.bestPracticesScore !== undefined) {
            setBestPracticesScore(scores.bestPracticesScore);
        }

        if (scores.agenticBrowsingScore !== undefined) {
            setAgenticBrowsingScore(scores.agenticBrowsingScore);
        }
    }

    function handleInsightsImported(importedInsights: ReportInsights) {
        const normalisedInsights = normaliseReportInsights(
            importedInsights,
            pageUrl,
            pageSpeedStrategy
        );

        setInsights(normalisedInsights);
        setPageUrl(normalisedInsights.testedUrl);
    }

    function handlePageUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
        const nextPageUrl = event.target.value;

        setPageUrl(nextPageUrl);

        if (insights && nextPageUrl.trim() !== insights.testedUrl) {
            setInsights(null);
        }
    }

    const form = (
        <form onSubmit={handleSubmit} className='form-stack'>
            <fieldset className='report-group-fields'>
                <legend>Report group</legend>

                {groups.length > 0 ? (
                    <label>
                        <span>Group</span>
                        <select
                            value={isCreatingGroup ? NEW_GROUP_VALUE : selectedGroupId}
                            onChange={handleGroupSelectionChange}
                            disabled={isSubmitting}
                            required
                        >
                            <option value=''>Choose a report group</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                            <option value={NEW_GROUP_VALUE}>Create new group</option>
                        </select>
                    </label>
                ) : null}

                {isCreatingGroup ? (
                    <div className='report-group-fields__new'>
                        <label>
                            <span>Group name</span>
                            <input
                                type='text'
                                value={groupName}
                                onChange={(event) => setGroupName(event.target.value)}
                                placeholder='Homepage mobile'
                                required
                                maxLength={REPORT_GROUP_NAME_MAX_LENGTH}
                                disabled={isSubmitting}
                            />
                        </label>

                        <label>
                            <span>Group page URL</span>
                            <input
                                type='url'
                                value={groupPageUrl}
                                onChange={handleGroupPageUrlChange}
                                placeholder='https://example.com/'
                                required
                                maxLength={REPORT_PAGE_URL_MAX_LENGTH}
                                disabled={isSubmitting}
                            />
                        </label>

                        <label>
                            <span>Group strategy</span>
                            <select
                                value={groupStrategy}
                                onChange={handleGroupStrategyChange}
                                disabled={isSubmitting}
                            >
                                <option value='mobile'>Mobile</option>
                                <option value='desktop'>Desktop</option>
                            </select>
                        </label>
                    </div>
                ) : null}
            </fieldset>

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

            <label>
                <span>Page URL</span>
                <input
                    type='url'
                    value={pageUrl}
                    onChange={handlePageUrlChange}
                    placeholder='https://example.com/'
                    required
                    maxLength={REPORT_PAGE_URL_MAX_LENGTH}
                />
            </label>

            {pageSpeedImportEnabled ? (
                <PageSpeedImportControls
                    projectId={projectId}
                    pageUrl={pageUrl}
                    strategy={pageSpeedStrategy}
                    onStrategyChange={setPageSpeedStrategy}
                    onImported={handleInsightsImported}
                    onScoresImported={handleScoresImported}
                    disabled={isSubmitting}
                />
            ) : null}

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

            {insights ? (
                <div className='report-import-result'>
                    <p className='report-import-result__status' role='status'>
                        PageSpeed data imported
                    </p>
                    <ReportInsightsSummary insights={insights} tone='light' />
                </div>
            ) : null}

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
