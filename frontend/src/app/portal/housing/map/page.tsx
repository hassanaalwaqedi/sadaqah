"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { BedDouble, Users } from "lucide-react";

// Mock data to show the map UI immediately, even if backend is empty
const MOCK_ROOMS = [
  { id: "1", room_number: "101", capacity: 2, current_occupancy: 0, is_available: true, room_type: "double" },
  { id: "2", room_number: "102", capacity: 2, current_occupancy: 1, is_available: true, room_type: "double" },
  { id: "3", room_number: "103", capacity: 1, current_occupancy: 1, is_available: false, room_type: "single" },
  { id: "4", room_number: "104", capacity: 4, current_occupancy: 2, is_available: true, room_type: "quad" },
];

export default function InteractiveMap() {
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    // In a real flow, we would fetch buildings, then rooms.
    // apiClient.get("/housing/buildings/123/rooms").then(...)
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Interactive Dorm Map</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Select an available room to book your bed for the upcoming semester.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Area */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Building A - Floor 1</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Available
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div> Partially Full
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div> Full
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map((room) => {
              const isFull = room.current_occupancy >= room.capacity;
              const isEmpty = room.current_occupancy === 0;
              const isSelected = selectedRoom === room.id;

              return (
                <button
                  key={room.id}
                  onClick={() => !isFull && setSelectedRoom(room.id)}
                  disabled={isFull}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isFull ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 opacity-60 cursor-not-allowed' : ''}
                    ${isEmpty && !isSelected ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/10' : ''}
                    ${!isEmpty && !isFull && !isSelected ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/10' : ''}
                    ${isSelected ? 'border-primary-500 bg-primary-50 shadow-md dark:bg-primary-900/20' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-lg">Room {room.room_number}</span>
                    <BedDouble className="w-5 h-5 opacity-70" />
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Users className="w-4 h-4" />
                    <span>{room.current_occupancy} / {room.capacity} occupied</span>
                  </div>

                  {/* Visual Bed Indicators */}
                  <div className="flex gap-1 mt-3">
                    {Array.from({ length: room.capacity }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full ${i < room.current_occupancy ? 'bg-surface-800 dark:bg-surface-200' : 'bg-surface-300 dark:bg-surface-700'}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <div className="glass-card p-6 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4">Your Selection</h2>
          
          {selectedRoom ? (
            <div className="space-y-4 animate-in">
              <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800 border">
                <div className="text-sm text-surface-500 mb-1">Selected Room</div>
                <div className="text-2xl font-bold">
                  {rooms.find(r => r.id === selectedRoom)?.room_number}
                </div>
                <div className="mt-2 text-sm">
                  Type: <span className="capitalize font-medium">{rooms.find(r => r.id === selectedRoom)?.room_type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Desired Move-in Date</label>
                <input type="date" className="form-input" />
              </div>

              <button className="btn-gradient w-full py-3 mt-4 text-lg">
                Confirm Bed Reservation
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-surface-500">
              <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Select an available room from the map to proceed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
