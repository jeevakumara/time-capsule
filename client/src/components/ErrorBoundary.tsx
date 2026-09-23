import { Component, ErrorInfo, ReactNode } from "react";

// Unit 5: Class-based Error Boundary — demonstrates React class component
// lifecycle methods (getDerivedStateFromError, componentDidCatch) for SPA resilience.

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    message: string;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: "" };

    // Lifecycle: invoked when a descendant throws; updates state to trigger fallback render
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    // Lifecycle: logs error details for debugging
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[ErrorBoundary] Caught rendering error:", error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center m-4">
                    <p className="text-red-700 font-semibold text-lg">An unexpected rendering error occurred.</p>
                    <p className="text-sm text-red-500 mt-1">{this.state.message}</p>
                    <button
                        className="mt-4 text-sm text-indigo-600 hover:underline"
                        onClick={() => this.setState({ hasError: false, message: "" })}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
