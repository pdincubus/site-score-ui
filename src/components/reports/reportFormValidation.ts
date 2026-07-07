const REPORT_TITLE_MAX_LENGTH = 160;
const REPORT_SUMMARY_MAX_LENGTH = 500;
const SCORE_MIN = 0;
const SCORE_MAX = 100;

type ScoreLabel = 'Accessibility' | 'Performance' | 'SEO' | 'UX';

const EMPTY_SCORE_MESSAGES: Record<ScoreLabel, string> = {
    Accessibility: 'Enter an accessibility score.',
    Performance: 'Enter a performance score.',
    SEO: 'Enter an SEO score.',
    UX: 'Enter a UX score.'
};

type ReportScoreInput = {
    accessibilityScore: string;
    performanceScore: string;
    seoScore: string;
    uxScore: string;
};

type ReportFormInput = ReportScoreInput & {
    title: string;
    summary: string;
};

type ReportFormData = {
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
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

    if (!title) {
        return {
            data: null,
            error: 'Enter a report title.'
        };
    }

    if (title.length > REPORT_TITLE_MAX_LENGTH) {
        return {
            data: null,
            error: `Report title must be ${REPORT_TITLE_MAX_LENGTH} characters or fewer.`
        };
    }

    if (!summary) {
        return {
            data: null,
            error: 'Enter a report summary.'
        };
    }

    if (summary.length > REPORT_SUMMARY_MAX_LENGTH) {
        return {
            data: null,
            error: `Report summary must be ${REPORT_SUMMARY_MAX_LENGTH} characters or fewer.`
        };
    }

    const accessibilityScore = validateScore(input.accessibilityScore, 'Accessibility');
    const performanceScore = validateScore(input.performanceScore, 'Performance');
    const seoScore = validateScore(input.seoScore, 'SEO');
    const uxScore = validateScore(input.uxScore, 'UX');

    if (accessibilityScore.value === null) {
        return {
            data: null,
            error: accessibilityScore.error
        };
    }

    if (performanceScore.value === null) {
        return {
            data: null,
            error: performanceScore.error
        };
    }

    if (seoScore.value === null) {
        return {
            data: null,
            error: seoScore.error
        };
    }

    if (uxScore.value === null) {
        return {
            data: null,
            error: uxScore.error
        };
    }

    return {
        data: {
            title,
            summary,
            accessibilityScore: accessibilityScore.value,
            performanceScore: performanceScore.value,
            seoScore: seoScore.value,
            uxScore: uxScore.value
        },
        error: ''
    };
}

export {
    REPORT_SUMMARY_MAX_LENGTH,
    REPORT_TITLE_MAX_LENGTH,
    SCORE_MAX,
    SCORE_MIN,
    validateReportForm
};
