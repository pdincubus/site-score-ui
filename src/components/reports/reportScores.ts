const SCORE_ITEMS = [
    {
        key: 'performanceScore',
        label: 'Performance'
    },
    {
        key: 'accessibilityScore',
        label: 'Accessibility'
    },
    {
        key: 'seoScore',
        label: 'SEO'
    },
    {
        key: 'bestPracticesScore',
        label: 'Best practices'
    },
    {
        key: 'agenticBrowsingScore',
        label: 'Agentic browsing'
    }
] as const;

type ScoreKey = (typeof SCORE_ITEMS)[number]['key'];

export { SCORE_ITEMS };
export type { ScoreKey };
