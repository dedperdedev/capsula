import { Component, ErrorInfo, ReactNode } from 'react';
import { checkStorageHealth, forceRestoreFromBackup, StorageError } from '../data/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'storage' | 'render' | 'unknown';
  storageHealth?: ReturnType<typeof checkStorageHealth>;
  isRecovering: boolean;
  recoverySuccess: boolean | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: 'unknown',
    isRecovering: false,
    recoverySuccess: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isStorageError = error instanceof StorageError || 
      error.message.includes('localStorage') ||
      error.message.includes('storage') ||
      error.message.includes('JSON');
    
    return { 
      hasError: true, 
      error,
      errorType: isStorageError ? 'storage' : 'render',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check storage health on any error
    const storageHealth = checkStorageHealth();
    this.setState({ storageHealth });
    
    // Log to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRecoverFromBackup = async () => {
    this.setState({ isRecovering: true });
    
    try {
      const recovered = forceRestoreFromBackup();
      if (recovered) {
        this.setState({ recoverySuccess: true });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        this.setState({ recoverySuccess: false, isRecovering: false });
      }
    } catch {
      this.setState({ recoverySuccess: false, isRecovering: false });
    }
  };

  private handleClearData = () => {
    if (confirm('Это удалит все данные приложения. Продолжить?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  private handleExportDiagnostics = () => {
    const diagnostics = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      errorType: this.state.errorType,
      storageHealth: this.state.storageHealth,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capsula-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  public render() {
    if (this.state.hasError) {
      const { errorType, error, storageHealth, isRecovering, recoverySuccess } = this.state;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
              {/* Header */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white mb-2">
                  {errorType === 'storage' ? 'Ошибка данных' : 'Что-то пошло не так'}
                </h1>
                <p className="text-sm text-gray-400">
                  {errorType === 'storage' 
                    ? 'Обнаружена проблема с сохраненными данными'
                    : error?.message || 'Произошла непредвиденная ошибка'}
                </p>
              </div>

              {/* Storage Status */}
              {storageHealth && (
                <div className={`p-3 rounded-lg ${storageHealth.corruption ? 'bg-red-500/10 border border-red-500/30' : 'bg-gray-700/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${storageHealth.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-white">
                      {storageHealth.isHealthy ? 'Хранилище исправно' : 'Повреждение данных'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {storageHealth.hasBackup 
                      ? 'Резервная копия доступна' 
                      : 'Резервная копия недоступна'}
                  </p>
                </div>
              )}

              {/* Recovery Status */}
              {recoverySuccess !== null && (
                <div className={`p-3 rounded-lg ${recoverySuccess ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className={`text-sm ${recoverySuccess ? 'text-green-400' : 'text-red-400'}`}>
                    {recoverySuccess 
                      ? '✓ Данные восстановлены! Перезагрузка...'
                      : '✗ Не удалось восстановить данные'}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {storageHealth?.hasBackup && !recoverySuccess && (
                  <button
                    onClick={this.handleRecoverFromBackup}
                    disabled={isRecovering}
                    className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                  >
                    {isRecovering ? 'Восстановление...' : '🔄 Восстановить из резервной копии'}
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm transition-colors"
                >
                  🔃 Перезагрузить страницу
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={this.handleExportDiagnostics}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs transition-colors"
                  >
                    📋 Экспорт диагностики
                  </button>
                  <button
                    onClick={this.handleClearData}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors"
                  >
                    🗑️ Сбросить все
                  </button>
                </div>
              </div>

              {/* Error Details (collapsed) */}
              <details className="text-xs">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                  Технические детали
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 rounded text-gray-400 overflow-auto max-h-32">
                  {error?.stack || error?.message || 'No error details'}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

