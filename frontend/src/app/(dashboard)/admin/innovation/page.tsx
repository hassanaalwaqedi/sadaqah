"use client";

import { useState } from "react";
import { Plus, Users, LayoutList, Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const MOCK_EVENTS = [
  { id: "1", name_en: "AI for Social Good Hackathon", status: "open", submissions: 24, deadline: "2024-11-10T23:59:59Z" },
  { id: "2", name_en: "FinTech Innovation Challenge", status: "draft", submissions: 0, deadline: "2024-11-25T23:59:59Z" },
  { id: "3", name_en: "Sustainability Ideathon 2023", status: "completed", submissions: 89, deadline: "2023-10-15T23:59:59Z" },
];

export default function AdminInnovationDashboard() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Innovation Management</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Create competitions, manage judging criteria, and track submissions.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Event
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="text-surface-500 text-sm mb-1">Active Events</div>
          <div className="text-3xl font-bold text-primary-600">2</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-surface-500 text-sm mb-1">Total Submissions</div>
          <div className="text-3xl font-bold">113</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-surface-500 text-sm mb-1">Pending Judging</div>
          <div className="text-3xl font-bold text-amber-500">24</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-surface-500 text-sm mb-1">Completed Events</div>
          <div className="text-3xl font-bold text-emerald-500">1</div>
        </div>
      </div>

      {/* Events Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Event Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Deadline</th>
              <th className="px-6 py-4 font-medium">Submissions</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  {event.name_en}
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${
                    event.status === 'open' ? 'badge-success' : 
                    event.status === 'draft' ? 'badge-warning' : 'badge-neutral'
                  } capitalize`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface-500">{formatDateTime(event.deadline)}</td>
                <td className="px-6 py-4 font-bold">{event.submissions}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-surface-500 hover:text-primary-600 p-2 rounded-lg hover:bg-surface-100 transition-colors" title="Submissions">
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button className="text-surface-500 hover:text-emerald-600 p-2 rounded-lg hover:bg-surface-100 transition-colors" title="Assign Judges">
                    <Users className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-surface-200 dark:border-surface-800 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Create New Event</h2>
            
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event Name (English)</label>
                <input type="text" className="form-input mt-1" placeholder="e.g. Hackathon 2024" />
              </div>
              <div>
                <label className="text-sm font-medium">Event Name (Arabic)</label>
                <input type="text" className="form-input mt-1" dir="rtl" placeholder="هاكاثون 2024" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Event Date</label>
                  <input type="date" className="form-input mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Submission Deadline</label>
                  <input type="datetime-local" className="form-input mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="form-input mt-1" rows={4} placeholder="Event rules and details..."></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100 dark:border-surface-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline px-4 py-2">Cancel</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-gradient px-6 py-2">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
