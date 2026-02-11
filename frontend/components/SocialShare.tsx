import React from 'react';
import { Share2 } from 'lucide-react';

interface SocialShareProps {
    url?: string;
    text?: string;
    showLabel?: boolean;
    className?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({
    url = "https://fabricadebestseller.com.br",
    text = "Acabei de criar meu próprio livro com Inteligência Artificial na Fábrica de Best Sellers! 🚀📚",
    showLabel = true,
    className = ""
}) => {

    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const links = [
        {
            name: 'WhatsApp',
            href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
            color: 'bg-green-500 hover:bg-green-600',
            icon: '📱'
        },
        {
            name: 'LinkedIn',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: 'bg-blue-600 hover:bg-blue-700',
            icon: '💼'
        },
        {
            name: 'X (Twitter)',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            color: 'bg-black hover:bg-gray-800',
            icon: '🐦'
        }
    ];

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            {showLabel && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Share2 className="w-3 h-3" />
                    <span>Compartilhe essa novidade</span>
                </div>
            )}
            <div className="flex gap-2">
                {links.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform hover:-translate-y-1 shadow-lg ${link.color}`}
                        title={`Compartilhar no ${link.name}`}
                    >
                        {link.icon}
                    </a>
                ))}
            </div>
        </div>
    );
};
