import { apiFetch } from './client';
import type { Dashboard } from '../types/api';

function getDashboard() {
    return apiFetch<Dashboard>('/dashboard');
}

export { getDashboard };
