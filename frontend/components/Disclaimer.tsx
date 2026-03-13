import React from 'react';
import { useLanguage } from '../i18n/context';

const Disclaimer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 mt-12 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-500 leading-relaxed text-center uppercase tracking-tight opacity-60">
                {(t as any).common.disclaimer.facebook}
                <br /><br />
                {(t as any).common.disclaimer.legal}
            </p>
        </div>
    );
};

export default Disclaimer;
