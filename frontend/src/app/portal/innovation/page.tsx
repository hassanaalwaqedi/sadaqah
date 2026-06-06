"use client";

import { useState } from "react";
import { Calendar, Users, Trophy, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const MOCK_EVENTS = [
  {
    id: "evt-001",
    name_en: "AI for Social Good Hackathon",
    description: "Build an AI application that solves a real-world social problem within 48 hours.",
    event_date: "2024-11-15T09:00:00Z",
    submission_deadline: "2024-11-10T23:59:59Z",
    status: "open",
  },
  {
    id: "evt-002",
    name_en: "FinTech Innovation Challenge",
    description: "Design the future of inclusive finance. Open to all business and engineering students.",
    event_date: "2024-12-01T10:00:00Z",
    submission_deadline: "2024-11-25T23:59:59Z",
    status: "open",
  }
];

export default function InnovationEvents() {
  const [events, setEvents] = useState(MOCK_EVENTS);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Innovation & Competitions</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2 max-w-2xl">
            Participate in hackathons, ideathons, and research competitions to showcase your skills, win prizes, and make an impact.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary-500 group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="badge badge-success capitalize px-3 py-1">{event.status}</span>
                <Trophy className="w-8 h-8 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2 line-clamp-2">
                {event.name_en}
              </h2>
              
              <p className="text-surface-600 dark:text-surface-400 text-sm mb-6 line-clamp-3">
                {event.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-xs text-surface-500">Event Date</p>
                    <p className="font-medium">{formatDateTime(event.event_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-surface-500">Submission Deadline</p>
                    <p className="font-medium">{formatDateTime(event.submission_deadline)}</p>
                  </div>
                </div>
              </div>

              <button className="w-full btn-gradient py-2.5 flex items-center justify-center gap-2">
                Submit Project <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
