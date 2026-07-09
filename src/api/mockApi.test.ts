import { describe, expect, it } from 'vitest';
import { mockApiFetch } from './mockApi';
import type { PaginatedResponse, Project } from '../types/api';

describe('mockApiFetch', () => {
    it('adds project summary stats derived from mock report and group data', async () => {
        const response = await mockApiFetch<PaginatedResponse<Project>>(
            '/projects?search=Crayons&page=1&limit=10'
        );
        const project = response.data[0];

        expect(project).toMatchObject({
            id: 'project-crayons-code',
            summary: {
                reportCount: 6,
                reportGroupCount: 2,
                latestReportCreatedAt: '2026-07-08T10:00:00.000Z',
                latestReportTitle: 'Homepage desktop - July snapshot',
                latestScores: {
                    performanceScore: 89,
                    accessibilityScore: 100,
                    seoScore: 100,
                    bestPracticesScore: 97,
                    agenticBrowsingScore: 91
                }
            }
        });
    });

    it('returns zero and null project summary values when a mock project has no reports', async () => {
        const response = await mockApiFetch<PaginatedResponse<Project>>(
            '/projects?search=Fresh&page=1&limit=10'
        );
        const project = response.data[0];

        expect(project).toMatchObject({
            id: 'project-fresh-start',
            summary: {
                reportCount: 0,
                reportGroupCount: 0,
                latestReportCreatedAt: null,
                latestReportTitle: null,
                latestScores: null
            }
        });
    });
});
