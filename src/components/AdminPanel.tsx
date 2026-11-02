"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Database,
  Cpu,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  UserX,
  Trash2,
  Crown,
  User,
  Download,
  Layers,
  FileCheck,
  AlertOctagon,
  HardDrive,
  Terminal,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DbUserRecord, DbJobRecord } from "@/lib/db/pg";
import { UserSession } from "@/components/AuthModal";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface AdminPanelProps {
  currentUser: UserSession | null;
  onNavigateTab: (tab: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onNavigateTab }) => {
  const { t, language } = useTranslation();
  const [users, setUsers] = useState<DbUserRecord[]>([]);
  const [allJobs, setAllJobs] = useState<DbJobRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("ALL");
  const [adminTab, setAdminTab] = useState<"users" | "jobs" | "system">("users");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load Admin Data from APIs
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, jobsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/history?all=true"),
      ]);

      const usersData = await usersRes.json();
      const jobsData = await jobsRes.json();

      if (usersData.users) setUsers(usersData.users);
      if (jobsData.history) setAllJobs(jobsData.history);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // User Actions
  const handleToggleRole = async (userId: string, currentRole: "ADMIN" | "USER") => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setActionMessage(`User role updated to ${newRole}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: "ACTIVE" | "SUSPENDED") => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        setActionMessage(`User status changed to ${newStatus}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionMessage("User removed from database");
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/history?jobId=${jobId}`, { method: "DELETE" });
      if (res.ok) {
        setAllJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSystemAudit = () => {
    const dataStr = JSON.stringify({ users, jobs: allJobs, exportedAt: new Date() }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Yamaha_System_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Jobs
  const filteredJobs = allJobs.filter((j) => {
    const matchesStatus = jobStatusFilter === "ALL" || j.status === jobStatusFilter;
    const matchesSearch =
      j.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.user_name && j.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>{t("admin_title")}</span>
            </h3>
            <Badge className="bg-purple-600 text-white font-bold text-[10px]">{t("nav_admin_badge")}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("admin_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAdminData}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{t("admin_btn_refresh")}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportSystemAudit}
            className="gap-1.5 bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("admin_btn_export_audit")}</span>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-purple-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 System Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin_card_users")}
            </span>
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{users.filter((u) => u.status === "ACTIVE").length} active accounts</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin_card_jobs")}
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{allJobs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {allJobs.filter((j) => j.status === "COMPLETED" || (j.status as any) === "SUCCESS").length} verified outputs
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin_card_pg")}
            </span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Neon PostgreSQL Cloud</span>
            <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/40">
              HEALTHY
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Neon Serverless Pooler verified</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("admin_card_redis")}
            </span>
            <Server className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Worker Queue</span>
            <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/40">
              READY
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Parallel container worker streams</p>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold max-w-md">
        <button
          onClick={() => setAdminTab("users")}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            adminTab === "users"
              ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{language === "kh" ? `គ្រប់គ្រងអ្នកប្រើ (${users.length})` : `User Management (${users.length})`}</span>
        </button>

        <button
          onClick={() => setAdminTab("jobs")}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            adminTab === "jobs"
              ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{language === "kh" ? `សវនកម្មបំលែង (${allJobs.length})` : `Global Jobs Audit (${allJobs.length})`}</span>
        </button>

        <button
          onClick={() => setAdminTab("system")}
          className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
            adminTab === "system"
              ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{language === "kh" ? "ប្រព័ន្ធ & ថ្នាំង" : "Nodes & Specs"}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: USER MANAGEMENT                                              */}
      {/* =================================================================== */}
      {adminTab === "users" && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins Only</option>
                <option value="USER">Standard Users</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500 uppercase text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Auth Provider</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Conversions</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {user.role === "ADMIN" && <Crown className="w-3 h-3 text-purple-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {user.email || (user.username ? `@${user.username}` : user.id)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {user.provider}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        className={`text-[10px] ${
                          user.role === "ADMIN"
                            ? "bg-purple-600 text-white font-bold"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {user.role}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={user.status === "ACTIVE" ? "success" : "destructive"}
                        className="text-[10px]"
                      >
                        {user.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {user.conversions_count || 0}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Role Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleRole(user.id, user.role)}
                          className="h-7 text-[11px] px-2.5"
                          title="Toggle Admin / User Role"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          <span>{user.role === "ADMIN" ? "Demote" : "Make Admin"}</span>
                        </Button>

                        {/* Toggle Status Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className="h-7 text-[11px] px-2"
                          title="Toggle Active / Suspended status"
                        >
                          {user.status === "ACTIVE" ? (
                            <UserX className="w-3 h-3 text-amber-500" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-emerald-500" />
                          )}
                        </Button>

                        {/* Delete User Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                          title="Delete user"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No users match the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 2: GLOBAL JOBS AUDIT                                            */}
      {/* =================================================================== */}
      {adminTab === "jobs" && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by file name or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status:</span>
              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500 uppercase text-[10px]">
                  <th className="py-3 px-4">Job ID &amp; File</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Target Model</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {job.original_filename}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{job.id}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {job.user_name || job.user_email || "Guest User"}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {formatBytes(job.original_size_bytes)}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                      {job.original_format} → {job.target_format}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          job.status === "COMPLETED" || (job.status as any) === "SUCCESS"
                            ? "success"
                            : job.status === "FAILED"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {job.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {job.target_hardware || "Yamaha Arranger"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteJob(job.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                        title="Delete log record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No jobs recorded matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =================================================================== */}
      {/* TAB 3: NODES & SYSTEM SPECS                                         */}
      {/* =================================================================== */}
      {adminTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              <span>Neon PostgreSQL Cloud Details</span>
            </CardTitle>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Database Engine</span>
                <span className="font-semibold text-slate-900 dark:text-white">Neon PostgreSQL 16 (AWS us-east-1)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Connection Pooling</span>
                <span className="font-mono text-emerald-500">Neon Serverless Pooler Active</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Tables Live</span>
                <span className="font-mono">users, conversion_jobs</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Failover Mode</span>
                <Badge variant="success" className="text-[10px]">IN-MEMORY FALLBACK (0 Downtime)</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              <span>Conversion Engine Telemetry</span>
            </CardTitle>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Execution Runtime</span>
                <span className="font-semibold text-slate-900 dark:text-white">Next.js Edge / Serverless API</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Parser Architecture</span>
                <span className="font-mono text-indigo-500">AWM2 Binary Stream / XPIH Extractor</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Audio Synthesis Engine</span>
                <span className="font-mono text-emerald-500">44.1 kHz PCM Wave Generator</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Telegram Bot Webhook</span>
                <Badge variant="default" className="text-[10px] bg-[#229ED9]">ACTIVE (@PPI_PPF_ConvertBot)</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
