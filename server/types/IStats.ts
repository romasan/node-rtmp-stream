import { IPixel } from './IPixel';

export interface IStats {
    history: {
        days: Record<string, {
            totalPixels: number;
            pixByHours: Record<string, number>;
            uniqSessions: number;
        }>,
        firstDay: string
        lastDay: string
        min: number[],
        hour: number[],
    };
    leaderboard: Record<string, number>;
    uuids: string[];
    colors: string[];
    ips: string[];
    totalCount: number;
    lastActivity: IPixel;
    [key: string]: any;
}
