import { Button } from '@/components/ui/button';
import { Share2, Copy } from 'lucide-react';
import { Player, Assignment } from '@/types/rotation';
import { useToast } from '@/hooks/use-toast';

interface ShareToWhatsAppProps {
    players: Player[];
    assignments: Assignment[];
    numberOfGames: number;
    ageGroup: string;
    gameLabels: Record<number, string>;
    playersOnField: number;
}

export const ShareToWhatsApp = ({
    players,
    assignments,
    numberOfGames,
    ageGroup,
    gameLabels,
}: ShareToWhatsAppProps) => {
    const { toast } = useToast();
    const hasAssignments = assignments.length > 0;

    const getPlayersForHalf = (game: number, half: number): Player[] => {
        const ids = new Set(assignments.filter(a => a.game === game && a.half === half).map(a => a.playerId));
        return players.filter(p => ids.has(p.id));
    };

    const getPlaytimeStats = () => {
        const counts = players.map(p => assignments.filter(a => a.playerId === p.id).length);
        const total = counts.reduce((s, c) => s + c, 0);
        return {
            minHalves: counts.length > 0 ? Math.min(...counts) : 0,
            averageHalves: players.length > 0 ? total / players.length : 0,
        };
    };

    const formatRotationPlan = (): string => {
        const lines: string[] = [`Squad Rotation Plan - ${ageGroup}`, ''];
        for (let game = 1; game <= numberOfGames; game++) {
            lines.push(gameLabels[game] || `Game ${game}`);
            lines.push(`Half 1: ${getPlayersForHalf(game, 1).map(p => p.name).join(', ') || '(empty)'}`);
            lines.push(`Half 2: ${getPlayersForHalf(game, 2).map(p => p.name).join(', ') || '(empty)'}`);
            lines.push('');
        }
        const { minHalves, averageHalves } = getPlaytimeStats();
        lines.push('---');
        lines.push(`Minimum playing time: ${minHalves} ${minHalves === 1 ? 'half' : 'halves'}`);
        lines.push(`Average playing time: ${averageHalves.toFixed(1)} halves per player`);
        return lines.join('\n');
    };

    const handleShare = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(formatRotationPlan())}`, '_blank');
    };

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(formatRotationPlan());
            toast({ title: 'Copied to clipboard', description: 'Paste it anywhere you like.' });
        } catch {
            toast({ title: 'Copy failed', description: 'Try the WhatsApp button instead.', variant: 'destructive' });
        }
    };

    return (
        <div className="pt-1">
            <h3
                className="text-foreground uppercase mb-3"
                style={{
                    fontFamily: '"Big Shoulders Display", system-ui, sans-serif',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                }}
            >
                Share Plan
            </h3>
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={handleShare}
                    disabled={!hasAssignments}
                    className="bg-[hsl(142_71%_35%)] hover:bg-[hsl(142_71%_30%)] text-white disabled:opacity-50"
                    title={!hasAssignments ? 'Add assignments first' : 'Share to WhatsApp'}
                >
                    <Share2 className="h-4 w-4 mr-2" />
                    WhatsApp
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={!hasAssignments}
                    title={!hasAssignments ? 'Add assignments first' : 'Copy to clipboard'}
                >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                </Button>
            </div>
        </div>
    );
};
