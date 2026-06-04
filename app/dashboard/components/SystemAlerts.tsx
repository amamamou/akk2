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
      return "bg-red-50/70";

    case "warning":
      return "bg-amber-50/70";

    default:
      return "bg-[#FAFAFB]";
  }
};
const getIconWrapper = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-600";

    case "warning":
      return "bg-amber-100 text-amber-600";

    default:
      return "bg-blue-100 text-blue-600";
  }
};
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle size={18}
strokeWidth={1.9} className="text-red-600" />;
      case "warning":
        return <AlertTriangle size={18} strokeWidth={1.9} className="text-amber-600" />;
      default:
        return <CheckCircle size={18} strokeWidth={1.9} className="text-blue-600" />;
    }
  };

  return (
<div
  className="
    bg-white
    rounded-2xl
    border
    border-gray-100
    shadow-[0_8px_30px_rgba(0,0,0,0.04)]
    p-6
  "
>      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
      {alerts.length === 0 ? (
        <div className="text-center text-sm text-gray-500">
<div className="flex items-center justify-center gap-3">
<CheckCircle
  size={18}
  strokeWidth={1.8}
  className="text-emerald-500"
/>            <span>All systems operational</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-xl p-4 flex items-start gap-3 ${getSeverityColor(
                alert.severity
              )}`}
            >
<div
  className={`
    flex-shrink-0
    h-10
    w-10
    rounded-xl
    flex
    items-center
    justify-center
    ${getIconWrapper(alert.severity)}
  `}
>                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
<div className="text-sm font-semibold text-gray-900">{alert.title}</div>
                <div className="text-xs text-gray-500 mt-1">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

