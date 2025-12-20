import { Button } from '@/components/ui/button';
import { Share2, Copy } from 'lucide-react';
import { Player, Assignment, EXPERIENCE_STARS } from '@/types/rotation';
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
    playersOnField,
}: ShareToWhatsAppProps) => {
    const { toast } = useToast();
    const hasAssignments = assignments.length > 0;

    const getPlayersForHalf = (game: number, half: number): Player[] => {
        const halfAssignments = assignments.filter(
            (a) => a.game === game && a.half === half
        );
        return players.filter((p) =>
            halfAssignments.some((a) => a.playerId === p.id)
        );
    };

    const formatPlayerList = (playerList: Player[]): string => {
        if (playerList.length === 0) return '(empty)';

        return playerList
            .map((p) => `${p.name} ${EXPERIENCE_STARS[p.experienceLevel]}`)
            .join(', ');
    };

    const getExperienceCounts = () => {
        return {
            1: players.filter((p) => p.experienceLevel === 1).length,
            2: players.filter((p) => p.experienceLevel === 2).length,
            3: players.filter((p) => p.experienceLevel === 3).length,
        };
    };

    const formatRotationPlan = (): string => {
        const lines: string[] = [];

        // Header
        lines.push(`📋 Squad Rotation Plan - ${ageGroup}`);
        lines.push('');

        // Games
        for (let game = 1; game <= numberOfGames; game++) {
            const gameLabel = gameLabels[game] || `Game ${game}`;
            lines.push(`🏉 ${gameLabel}`);

            // Half 1
            const half1Players = getPlayersForHalf(game, 1);
            lines.push(`  Half 1: ${formatPlayerList(half1Players)}`);

            // Half 2
            const half2Players = getPlayersForHalf(game, 2);
            lines.push(`  Half 2: ${formatPlayerList(half2Players)}`);

            lines.push('');
        }

        // Experience summary
        lines.push('---');
        lines.push('✨ Experience Summary');
        const expCounts = getExperienceCounts();
        lines.push(`  ⭐⭐⭐ Match Ready: ${expCounts[3]} players`);
        lines.push(`  ⭐⭐ Getting There: ${expCounts[2]} players`);
        lines.push(`  ⭐ New Players: ${expCounts[1]} players`);
        lines.push('');

        // Stats
        lines.push(`📊 Squad Size: ${players.length}`);
        lines.push(`🎯 Total Games: ${numberOfGames}`);

        return lines.join('\n');
    };

    const handleShare = () => {
        const message = formatRotationPlan();
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCopyToClipboard = async () => {
        try {
            const message = formatRotationPlan();
            await navigator.clipboard.writeText(message);
            toast({
                title: 'Copied to clipboard!',
                description: 'Rotation plan copied. Paste it anywhere you like.',
            });
        } catch (error) {
            toast({
                title: 'Copy failed',
                description: 'Please try again or use the WhatsApp button.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            <Button
                onClick={handleShare}
                disabled={!hasAssignments}
                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white disabled:bg-muted disabled:text-muted-foreground w-full sm:w-auto"
                title={!hasAssignments ? 'Add player assignments to share your plan' : 'Share to WhatsApp'}
            >
                <Share2 className="h-4 w-4 mr-2" />
                Share to WhatsApp
            </Button>
            <Button
                variant="outline"
                onClick={handleCopyToClipboard}
                disabled={!hasAssignments}
                title={!hasAssignments ? 'Add player assignments first' : 'Copy to clipboard'}
                className="w-full sm:w-auto"
            >
                <Copy className="h-4 w-4 mr-2" />
                <span className="sm:inline">Copy to Clipboard</span>
            </Button>
        </div>
    );
};
