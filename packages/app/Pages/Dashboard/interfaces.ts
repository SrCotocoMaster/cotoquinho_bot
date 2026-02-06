export interface DashboardProps {
    // Add props if needed
}

export type MusicAction = 'play' | 'pause' | 'resume' | 'stop' | 'skip' | 'back' | 'shuffle';

export interface PlayerStatus {
    status: string;
    current: string | null;
    queue: number;
    history: number;
}
