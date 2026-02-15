"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TransportType, GpsPoint, MovementSegment } from "@/types";

interface MovementState {
  isTracking: boolean;
  movementId: string | null;
  currentTransport: TransportType;
  segments: MovementSegment[];
  currentSegmentPoints: GpsPoint[];
  totalDistance: number;
  startTime: number | null;
  elapsedSec: number;
  estimatedSc: number;

  startTracking: (movementId: string, transport: TransportType) => void;
  stopTracking: () => void;
  setTransport: (transport: TransportType) => void;
  addGpsPoint: (point: GpsPoint) => void;
  updateDistance: (meters: number) => void;
  updateElapsed: (sec: number) => void;
  updateEstimatedSc: (sc: number) => void;
  finalizeSegment: () => MovementSegment | null;
  reset: () => void;
}

const initialState = {
  isTracking: false,
  movementId: null,
  currentTransport: "WALK" as TransportType,
  segments: [],
  currentSegmentPoints: [],
  totalDistance: 0,
  startTime: null,
  elapsedSec: 0,
  estimatedSc: 0,
};

export const useMovementStore = create<MovementState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startTracking: (movementId, transport) =>
        set({
          isTracking: true,
          movementId,
          currentTransport: transport,
          startTime: Date.now(),
          segments: [],
          currentSegmentPoints: [],
          totalDistance: 0,
          elapsedSec: 0,
          estimatedSc: 0,
        }),

      stopTracking: () => set({ isTracking: false }),

      setTransport: (transport) => {
        const state = get();
        if (state.currentTransport !== transport) {
          // Finalize current segment before switching
          state.finalizeSegment();
          set({ currentTransport: transport });
        }
      },

      addGpsPoint: (point) =>
        set((s) => ({
          currentSegmentPoints: [...s.currentSegmentPoints, point],
        })),

      updateDistance: (meters) => set({ totalDistance: meters }),
      updateElapsed: (sec) => set({ elapsedSec: sec }),
      updateEstimatedSc: (sc) => set({ estimatedSc: sc }),

      finalizeSegment: () => {
        const state = get();
        const points = state.currentSegmentPoints;
        if (points.length < 2) return null;

        let dist = 0;
        for (let i = 1; i < points.length; i++) {
          const dLat = ((points[i].lat - points[i - 1].lat) * Math.PI) / 180;
          const dLng = ((points[i].lng - points[i - 1].lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((points[i - 1].lat * Math.PI) / 180) *
              Math.cos((points[i].lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          dist += 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        const duration = (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
        const avgSpeed = duration > 0 ? (dist / duration) * 3.6 : 0;

        const segment: MovementSegment = {
          transport: state.currentTransport,
          distance: Math.round(dist),
          duration: Math.round(duration),
          avgSpeed: Math.round(avgSpeed * 10) / 10,
          points,
          sc: 0,
        };

        set((s) => ({
          segments: [...s.segments, segment],
          currentSegmentPoints: [],
        }));

        return segment;
      },

      reset: () => set(initialState),
    }),
    {
      name: "stepmeal-movement",
      partialize: (state) => ({
        isTracking: state.isTracking,
        movementId: state.movementId,
        currentTransport: state.currentTransport,
        segments: state.segments,
        totalDistance: state.totalDistance,
        startTime: state.startTime,
        elapsedSec: state.elapsedSec,
      }),
    }
  )
);
