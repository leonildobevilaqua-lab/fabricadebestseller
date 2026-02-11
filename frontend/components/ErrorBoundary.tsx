import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-center bg-red-50 text-red-800 rounded-xl m-4 border border-red-200">
                    <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado.</h2>
                    <p className="mb-4">Ocorreu um erro ao exibir esta tela.</p>
                    <div className="bg-white p-4 rounded border border-red-100 text-left overflow-auto max-h-40 text-xs font-mono mb-4">
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 font-bold"
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
