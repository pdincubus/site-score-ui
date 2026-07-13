import { describe, expect, it } from 'vitest';
import { mockApiFetch } from './mockApi';
import type { ClientListItem, Dashboard, PaginatedResponse, Project } from '../types/api';

describe('mockApiFetch', () => {
    it('provides recent shared workspace activity for the dashboard', async () => {
        const dashboard = await mockApiFetch<Dashboard>('/dashboard');

        expect(dashboard.clients.length).toBeGreaterThan(0);
        expect(dashboard.projects.length).toBeGreaterThan(0);
        expect(dashboard.results.length).toBeGreaterThan(0);
        expect(dashboard.projects[0]).toHaveProperty('clientName');
        expect(dashboard.results[0]).toEqual(
            expect.objectContaining({
                projectName: expect.any(String)
            })
        );
    });

    it('adds client summary stats derived from mock projects and reports', async () => {
        const response = await mockApiFetch<PaginatedResponse<ClientListItem>>('/clients');
        const crayonsClient = response.data.find((client) => client.id === 'client-crayons-code');

        expect(crayonsClient?.summary).toEqual({
            projectCount: 1,
            reportCount: 6
        });
    });

    it('filters mock projects by assigned or unassigned client', async () => {
        const assigned = await mockApiFetch<PaginatedResponse<Project>>(
            '/projects?clientId=client-crayons-code'
        );
        const unassigned = await mockApiFetch<PaginatedResponse<Project>>(
            '/projects?clientId=unassigned'
        );

        expect(assigned.data.every((project) => project.clientId === 'client-crayons-code')).toBe(true);
        expect(unassigned.data.every((project) => project.clientId === null)).toBe(true);
    });

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
