import React from 'react';

interface StepWizardProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: "Nicho & Autor" },
  { id: 2, name: "Pesquisa IA" },
  { id: 3, name: "Escrita Viral" },
  { id: 4, name: "Pronto" },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-brand-500 -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step) => {
          const isActive = step.id <= currentStep;
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center bg-white p-2 rounded-lg">
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all duration-300 ${
                  isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step.id}
              </div>
              <span className={`mt-2 text-xs font-medium uppercase tracking-wider ${isCurrent ? 'text-brand-900' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};