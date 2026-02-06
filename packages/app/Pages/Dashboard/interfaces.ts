export interface DashboardProps {
    // Add props if needed
}

export type MusicAction = 'play' | 'pause' | 'resume' | 'stop' | 'next' | 'back';

export interface PlayerStatus {
    status: string;
    current: string | null;
    queue: number;
    history: number;
}
