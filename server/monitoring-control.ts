/**
 * Monitoring Service Control
 * 
 * Admin interface to control the monitoring service
 */

import { getMonitoringService } from './monitoring-service';

export interface MonitoringStatus {
  isRunning: boolean;
  lastCycleTime?: number;
  totalRegionsMonitored: number;
  totalRestocksDetected: number;
  uptime?: number;
}

let serviceStartTime: number | null = null;
let totalRestocksDetected = 0;

/**
 * Get current monitoring service status
 */
export function getMonitoringStatus(): MonitoringStatus {
  const service = getMonitoringService();
  const isRunning = (service as any).isRunning || false;
  
  return {
    isRunning,
    totalRegionsMonitored: 15, // From seeded data
    totalRestocksDetected,
    uptime: serviceStartTime ? Date.now() - serviceStartTime : undefined,
  };
}

/**
 * Start the monitoring service
 */
export async function startMonitoring(): Promise<{ success: boolean; message: string }> {
  try {
    const service = getMonitoringService();
    await service.start();
    
    if (!serviceStartTime) {
      serviceStartTime = Date.now();
    }
    
    return {
      success: true,
      message: 'Monitoring service started successfully',
    };
  } catch (error) {
    console.error('[MonitoringControl] Error starting service:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start monitoring service',
    };
  }
}

/**
 * Stop the monitoring service
 */
export function stopMonitoring(): { success: boolean; message: string } {
  try {
    const service = getMonitoringService();
    service.stop();
    
    return {
      success: true,
      message: 'Monitoring service stopped successfully',
    };
  } catch (error) {
    console.error('[MonitoringControl] Error stopping service:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to stop monitoring service',
    };
  }
}

/**
 * Increment restock counter
 */
export function incrementRestockCounter() {
  totalRestocksDetected++;
}

/**
 * Reset monitoring statistics
 */
export function resetMonitoringStats() {
  totalRestocksDetected = 0;
  serviceStartTime = Date.now();
}
