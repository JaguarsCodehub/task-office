export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    created_at: string;
    avatar_url: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    project_id: string;
    assigned_to: string;
    created_by: string;
    status: 'in_progress' | 'pending' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
    notes: string;
    created_at: string;
    image_url: string;
    completed_at: string;
}

export interface TaskAssignment {
    task: any;
    id: string;
    task_id: string;
    assigned_to: string;
    assigned_by: string;
    assigned_at: string;
    status: 'in_progress' | 'pending' | 'completed';
    project_id: string;
    client_id: string;
    start_date: string;
    due_date: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    description: string;
    created_at: string;
}