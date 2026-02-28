import { useRef } from 'react';
import { Share } from 'react-native';

export const useCardsShareImage = () => {
    const shareRef = useRef<any>(null);

    const captureAndShare = async () => {
        try {
            if (!shareRef.current?.capture) return;

            const uri = await shareRef.current.capture();
            await Share.share({
                title: 'My LawnLens Impact',
                message: 'Check out the ecological impact of my LawnLens yard plan!',
                url: uri, // iOS supports file URLs in share
            });
        } catch (error) {
            console.error('Error sharing image', error);
        }
    };

    return { shareRef, captureAndShare };
};
