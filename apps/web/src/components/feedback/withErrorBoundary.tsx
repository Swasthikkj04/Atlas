import React from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary';

/**
 * Higher-Order Component for wrapping feature components with an ErrorBoundary.
 */
export function withErrorBoundary<P extends object>(
  ComponentToWrap: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <ComponentToWrap {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `WithErrorBoundary(${
    ComponentToWrap.displayName || ComponentToWrap.name || 'Component'
  })`;

  return WrappedComponent;
}
