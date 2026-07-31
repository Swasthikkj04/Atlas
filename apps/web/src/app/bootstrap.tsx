import React from 'react';
import { App } from './App';

export async function bootstrap(): Promise<{ RootComponent: React.ComponentType }> {
  // Initialize services, telemetry, or API interceptors here before render
  return { RootComponent: App };
}
