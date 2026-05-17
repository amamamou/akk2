"use client";

import React, { useRef, useState } from "react";
import { X, MapPin, Wifi, Cpu } from "lucide-react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    locationName?: string;
    ipAddress?: string;
    deviceId?: string;
  }) => Promise<void>;
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  onSubmit,
}: AddPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Player name is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        locationName: locationName.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        deviceId: deviceId.trim() || undefined,
      });

      // Reset form
      setName("");
      setLocationName("");
      setIpAddress("");
      setDeviceId("");
      onClose();
    } catch (error) {
      console.error("Failed to add player:", error);
      alert("Failed to add player. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Player</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Player Name (Required) */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Player Name *
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lobby Speaker"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
              required
            />
          </div>

          {/* Location Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              Location Name
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Reception Area"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          {/* IP Address */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <Wifi size={16} className="text-gray-500" />
              IP Address
            </label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g. 192.168.1.100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          {/* Device ID */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              <Cpu size={16} className="text-gray-500" />
              Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. DEVICE-12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A473FF]/30"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#A473FF] text-white rounded-md text-sm font-medium hover:brightness-90 disabled:opacity-50"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Adding..." : "Add Player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

