import type { PageSpeedStrategy, ReportInsights } from '../../types/api';

const REPORT_TITLE_MAX_LENGTH = 160;
const REPORT_SUMMARY_MAX_LENGTH = 500;
const REPORT_PAGE_URL_MAX_LENGTH = 2048;
const REPORT_GROUP_NAME_MAX_LENGTH = 120;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

type ScoreLabel = 'Performance' | 'Accessibility' | 'SEO' | 'Best practices' | 'Agentic browsing';

const EMPTY_SCORE_MESSAGES: Record<ScoreLabel, string> = {
    Performance: 'Enter a performance score.',
    Accessibility: 'Enter an accessibility score.',
    SEO: 'Enter an SEO score.',
    'Best practices': 'Enter a best practices score.',
    'Agentic browsing': 'Enter an agentic browsing score.'
};

type ReportScoreInput = {
    performanceScore: string;
    accessibilityScore: string;
    seoScore: string;
    bestPracticesScore: string;
    agenticBrowsingScore: string;
};

type ReportFormInput = ReportScoreInput & {
    groupId?: string;
    title: string;
    summary: string;
    pageUrl: string;
    insights?: ReportInsights | null;
};

type ReportFormData = {
    groupId?: string;
    title: string;
    summary: string;
    pageUrl: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights?: ReportInsights | null;
};

type ReportFormValidationResult =
    | {
          data: ReportFormData;
          error: '';
      }
    | {
          data: null;
          error: string;
      };

type ScoreValidationResult =
    | {
          value: number;
          error: '';
      }
    | {
          value: null;
          error: string;
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

type ReportGroupFormInput = {
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
};

type ReportGroupFormData = {
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
};

type ReportGroupFormValidationResult =
    | {
          data: ReportGroupFormData;
          error: '';
      }
    | {
          data: null;
          error: string;
      };

function validateReportPageUrl(value: string): UrlValidationResult {
    const url = value.trim();

    if (!url) {
        return {
            url: null,
            error: 'Enter a page URL.'
        };
    }

    if (url.length > REPORT_PAGE_URL_MAX_LENGTH) {
        return {
            url: null,
            error: `Page URL must be ${REPORT_PAGE_URL_MAX_LENGTH} characters or fewer.`
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

function validateReportGroupForm(
    input: ReportGroupFormInput
): ReportGroupFormValidationResult {
    const name = input.name.trim();
    const pageUrl = validateReportPageUrl(input.pageUrl);

    if (!name) {
        return {
            data: null,
            error: 'Enter a group name.'
        };
    }

    if (name.length > REPORT_GROUP_NAME_MAX_LENGTH) {
        return {
            data: null,
            error: `Group name must be ${REPORT_GROUP_NAME_MAX_LENGTH} characters or fewer.`
        };
    }

    if (!pageUrl.url) {
        return {
            data: null,
            error: pageUrl.error
        };
    }

    return {
        data: {
            name,
            pageUrl: pageUrl.url,
            strategy: input.strategy
        },
        error: ''
    };
}

function validateScore(value: string, label: ScoreLabel): ScoreValidationResult {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return {
            value: null,
            error: EMPTY_SCORE_MESSAGES[label]
        };
    }

    const score = Number(trimmedValue);

    if (
        !Number.isFinite(score) ||
        !Number.isInteger(score) ||
        score < SCORE_MIN ||
        score > SCORE_MAX
    ) {
        return {
            value: null,
            error: `${label} score must be a whole number from ${SCORE_MIN} to ${SCORE_MAX}.`
        };
    }

    return {
        value: score,
        error: ''
    };
}

function validateReportForm(input: ReportFormInput): ReportFormValidationResult {
    const title = input.title.trim();
    const summary = input.summary.trim();
    const groupId = input.groupId?.trim();
    const pageUrl = validateReportPageUrl(input.pageUrl);

    if (input.groupId !== undefined && !groupId) {
        return {
            data: null,
            error: 'Choose a result group.'
        };
    }

    if (!title) {
        return {
            data: null,
            error: 'Enter a result title.'
        };
    }

    if (title.length > REPORT_TITLE_MAX_LENGTH) {
        return {
            data: null,
            error: `Result title must be ${REPORT_TITLE_MAX_LENGTH} characters or fewer.`
        };
    }

    if (!summary) {
        return {
            data: null,
            error: 'Enter a result summary.'
        };
    }

    if (summary.length > REPORT_SUMMARY_MAX_LENGTH) {
        return {
            data: null,
            error: `Result summary must be ${REPORT_SUMMARY_MAX_LENGTH} characters or fewer.`
        };
    }

    if (!pageUrl.url) {
        return {
            data: null,
            error: pageUrl.error
        };
    }

    const performanceScore = validateScore(input.performanceScore, 'Performance');
    const accessibilityScore = validateScore(input.accessibilityScore, 'Accessibility');
    const seoScore = validateScore(input.seoScore, 'SEO');
    const bestPracticesScore = validateScore(input.bestPracticesScore, 'Best practices');
    const agenticBrowsingScore = validateScore(input.agenticBrowsingScore, 'Agentic browsing');

    if (performanceScore.value === null) {
        return {
            data: null,
            error: performanceScore.error
        };
    }

    if (accessibilityScore.value === null) {
        return {
            data: null,
            error: accessibilityScore.error
        };
    }

    if (seoScore.value === null) {
        return {
            data: null,
            error: seoScore.error
        };
    }

    if (bestPracticesScore.value === null) {
        return {
            data: null,
            error: bestPracticesScore.error
        };
    }

    if (agenticBrowsingScore.value === null) {
        return {
            data: null,
            error: agenticBrowsingScore.error
        };
    }

    const data: ReportFormData = {
        title,
        summary,
        pageUrl: pageUrl.url,
        performanceScore: performanceScore.value,
        accessibilityScore: accessibilityScore.value,
        seoScore: seoScore.value,
        bestPracticesScore: bestPracticesScore.value,
        agenticBrowsingScore: agenticBrowsingScore.value
    };

    if (groupId) {
        data.groupId = groupId;
    }

    if (input.insights) {
        data.insights = input.insights;
    }

    return {
        data,
        error: ''
    };
}

export {
    REPORT_GROUP_NAME_MAX_LENGTH,
    REPORT_PAGE_URL_MAX_LENGTH,
    REPORT_SUMMARY_MAX_LENGTH,
    REPORT_TITLE_MAX_LENGTH,
    SCORE_MAX,
    SCORE_MIN,
    validateReportGroupForm,
    validateReportPageUrl,
    validateReportForm
};
