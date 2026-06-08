"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Scale, Calendar, Trash, Plus, Edit2, Save, X } from "lucide-react";

export default function WeightPage() {
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");
  const [now] = useState(() => new Date());

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const addLogMutation = useMutation({
    mutationFn: async () => {
      if (!weight) throw new Error("Weight is required");
      return trackerService.addWeightLog(parseFloat(weight), date, time, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Weight logged successfully!");
      setWeight("");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log weight");
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await trackerService.deleteWeightLog(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Weight log deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete weight log");
    }
  });

  const saveEditMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editWeight) throw new Error("Weight is required");
      await trackerService.updateWeightLog(id, {
        weight: parseFloat(editWeight),
        date: editDate,
        time_recorded: editTime || null,
        notes: editNotes || null
      });
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Weight log updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update weight log");
    }
  });

  const startEditing = (log: any) => {
    setEditingId(log.id);
    setEditWeight(log.weight.toString());
    setEditDate(log.date);
    setEditTime(log.time_recorded || "");
    setEditNotes(log.notes || "");
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this weight log?")) {
      deleteLogMutation.mutate(id);
    }
  };

  // Calculate rate of change
  const currentWeight = logs[0]?.weight || 94;
  const lastWeekWeight = logs.find(
    (l) => new Date(l.date) <= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  )?.weight || 94;
  const weeklyChange = currentWeight - lastWeekWeight;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Weight Tracking</h1>
        <p className="text-white/60">
          Monitor your weight trend, weekly velocity, and add daily log entries.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Logging Card */}
        <Card className="bg-[#161b22] border-white/[0.06] text-white">
          <CardHeader>
            <CardTitle>Log Weight</CardTitle>
            <CardDescription className="text-white/40">Keep consistency with morning weigh-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g. 84.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Weighed fasted, feeling good"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <Button
              className="w-full mt-2 bg-teal-500 text-slate-900 hover:bg-teal-400 font-semibold"
              onClick={() => addLogMutation.mutate()}
              disabled={addLogMutation.isPending}
            >
              {addLogMutation.isPending ? "Logging..." : "Log Weight"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Stats */}
        <Card className="bg-[#161b22] border-white/[0.06] text-white md:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Goal Projection & Trends</CardTitle>
            <CardDescription className="text-white/40">Your weekly transformation statistics.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Weekly Change Rate
              </div>
              <div
                className={`text-2xl font-bold ${
                  weeklyChange <= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {weeklyChange <= 0 ? "" : "+"}
                {formatNumber(weeklyChange)} kg
              </div>
              <p className="text-xs text-white/40">Compared to 7 days ago</p>
            </div>

            <div className="space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Estimated to Goal (72kg)
              </div>
              <div className="text-2xl font-bold text-teal-400">
                {formatNumber(Math.max(0, currentWeight - 72))} kg
              </div>
              <p className="text-xs text-white/40">Remaining fat loss required</p>
            </div>
          </CardContent>

          <div className="p-6 pt-0">
            {/* History Table */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-[#0f1117] border-b border-white/[0.08] text-white/60">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Weight</th>
                      <th className="px-4 py-2 font-semibold">Time</th>
                      <th className="px-4 py-2 font-semibold">Notes</th>
                      <th className="px-4 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        {editingId === log.id ? (
                          <>
                            <td className="px-4 py-2">
                              <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="h-8 py-1 px-2 text-xs bg-zinc-900 border-white/10"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="h-8 py-1 px-2 text-xs bg-zinc-900 border-white/10 w-20"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="h-8 py-1 px-2 text-xs bg-zinc-900 border-white/10 w-24"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="h-8 py-1 px-2 text-xs bg-zinc-900 border-white/10"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => saveEditMutation.mutate(log.id)}
                                  disabled={saveEditMutation.isPending}
                                  className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-white/5"
                                  title="Save Changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-white/40 hover:text-white/60 p-1 rounded hover:bg-white/5"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">{log.date}</td>
                            <td className="px-4 py-3 font-semibold text-teal-400">
                              {log.weight} kg
                            </td>
                            <td className="px-4 py-3 text-white/60">
                              {log.time_recorded || "--:--"}
                            </td>
                            <td className="px-4 py-3 text-xs text-white/40 truncate max-w-[120px]" title={log.notes || undefined}>
                              {log.notes || "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => startEditing(log)}
                                  className="text-white/40 hover:text-teal-400 p-1 rounded hover:bg-white/5 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(log.id)}
                                  className="text-white/40 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                                  title="Delete"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-white/30">
                          No weigh-ins recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
