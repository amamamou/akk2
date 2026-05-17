"use client";

import React from "react";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export interface SystemAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp?: string;
}

interface SystemAlertsProps {
  alerts: SystemAlert[];
  isLoading?: boolean;
}

export default function SystemAlerts({ alerts, isLoading }: SystemAlertsProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
        <div className="text-center text-sm text-gray-500">Loading alerts...</div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle size={16} className="text-red-600" />;
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-600" />;
      default:
        return <CheckCircle size={16} className="text-blue-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
      {alerts.length === 0 ? (
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>All systems operational</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 flex items-start gap-3 ${getSeverityColor(
                alert.severity
              )}`}
            >
              <div className="flex-shrink-0 pt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{alert.title}</div>
                <div className="text-xs opacity-75 mt-1">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

