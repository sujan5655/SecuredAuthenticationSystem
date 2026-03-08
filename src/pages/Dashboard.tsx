import { useEffect, useState, useCallback, useContext } from "react";
import {
  ShieldCheck,
  Lock,
  Monitor,
  User,
  Mail,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  Key,
  FileText,
  Download,
  RefreshCw,
  X,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { decodeJWT } from "../utils/jwt";
import * as api from "../api/dashboard";
import { ToastContext } from "../context/ToastContext";

const API_BASE = "http://localhost:8000/api";

type Profile = {
  username: string;
  email: string;
  role: string;
  memberSince: string | null;
  passwordExpiresAt: string | null;
  daysUntilPasswordExpiry?: number;
  emailVerified?: boolean;
};

type Session = {
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  firstSeen: string;
  lastActive: string;
  isCurrent: boolean;
};

type SecurityOverview = {
  loginAttempts24h: number;
  failedAttempts24h: number;
  lastLogin: string | null;
  securityScore: number;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  passwordExpiresAt: string | null;
  daysUntilPasswordExpiry: number | null;
  lastSecurityCheck: string;
};

type LoginAnalytics = {
  totalLogins: number;
  thisWeek: number;
  avgPerDay: number;
  successRate: number;
  chartData: { month: string; count: number }[];
};

type SecurityLogEvent = {
  title: string;
  description: string;
  ip: string;
  source: string;
  createdAt: string;
};

type ActivityItem = {
  action: string;
  title: string;
  description: string;
  ip: string | null;
  createdAt: string;
  status: string;
};

type NotificationItem = {
  title: string;
  message: string;
  createdAt: string;
  type: string;
};

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  return d.toLocaleDateString();
}

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);
  const [loginAnalytics, setLoginAnalytics] = useState<LoginAnalytics | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [securityLogsModalOpen, setSecurityLogsModalOpen] = useState(false);
  const [activityHistoryModalOpen, setActivityHistoryModalOpen] = useState(false);
  const [sessionExpiringOpen, setSessionExpiringOpen] = useState(false);
  const [lockdownOpen, setLockdownOpen] = useState(false);

  const [securityLogs, setSecurityLogs] = useState<{ summary: any; events: SecurityLogEvent[] } | null>(null);
  const [activityHistory, setActivityHistory] = useState<{ activities: ActivityItem[]; summary: any } | null>(null);
  const [sessionCountdown, setSessionCountdown] = useState(30);
  const [lockdownCountdown, setLockdownCountdown] = useState(14);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navigate = useNavigate();
  const toast = useContext(ToastContext);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setError(null);
    try {
      const [profileRes, sessionsRes, overviewRes, analyticsRes, activityRes] = await Promise.all([
        api.getProfile(),
        api.getSessions(),
        api.getSecurityOverview(),
        api.getLoginAnalytics(),
        api.getActivityHistory(1, 10),
      ]);
      setProfile(profileRes);
      setSessions(sessionsRes.sessions || []);
      const current = (sessionsRes.sessions || []).find((s: Session) => s.isCurrent);
      setCurrentSession(current || (sessionsRes.sessions && sessionsRes.sessions[0]) || null);
      setSecurityOverview(overviewRes);
      setLoginAnalytics(analyticsRes);
      setRecentActivities(activityRes.activities || []);
      const decoded = decodeJWT(token);
      if (decoded) {
        setUserName(decoded.name || profileRes.username);
        setUserEmail(decoded.email || profileRes.email);
      } else {
        setUserName(profileRes.username);
        setUserEmail(profileRes.email);
      }
      try {
        const notifRes = await api.getNotifications();
        setNotifications(notifRes.notifications || []);
      } catch {
        setNotifications([]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard");
      if (e.message?.includes("Unauthorized") || e.message?.includes("token")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const checkExpiry = () => {
      const decoded = decodeJWT(token);
      if (!decoded?.exp) return;
      const exp = decoded.exp * 1000;
      const remaining = exp - Date.now();
      if (remaining <= 30 * 1000 && remaining > 0 && !sessionExpiringOpen) {
        setSessionExpiringOpen(true);
        setSessionCountdown(Math.ceil(remaining / 1000));
      }
    };
    const t = setInterval(checkExpiry, 5000);
    checkExpiry();
    return () => clearInterval(t);
  }, [sessionExpiringOpen]);

  useEffect(() => {
    if (!sessionExpiringOpen) return;
    const t = setInterval(() => {
      setSessionCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          handleLogout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sessionExpiringOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("sessionId");
    navigate("/login");
  };

  const handleStayLoggedIn = async () => {
    try {
      await api.refreshToken();
      setSessionExpiringOpen(false);
    } catch {
      handleLogout();
    }
  };

  const handleEndOtherSessions = async () => {
    try {
      await api.endOtherSessions();
      setSessionsModalOpen(false);
      fetchAll();
      toast?.success("Other sessions ended successfully.");
    } catch (e: any) {
      toast?.error(e.message || "Failed to end sessions.");
    }
  };

  const openSecurityLogs = async () => {
    try {
      const data = await api.getSecurityLogs();
      setSecurityLogs(data);
      setSecurityLogsModalOpen(true);
    } catch (e: any) {
      toast?.error(e.message || "Failed to load security logs.");
    }
  };

  const openActivityHistory = async () => {
    try {
      const data = await api.getActivityHistory(1, 50);
      setActivityHistory({ activities: data.activities, summary: data.summary });
      setActivityHistoryModalOpen(true);
    } catch (e: any) {
      toast?.error(e.message || "Failed to load activity history.");
    }
  };

  const downloadCsv = async () => {
    try {
      const blob = await api.exportActivityCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity-history.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast?.success("Activity log downloaded successfully.");
    } catch (e: any) {
      toast?.error(e.message || "Failed to download.");
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    }
  }, []);

  const openNotifications = () => {
    setNotificationsOpen((prev) => {
      if (!prev) fetchNotifications();
      return !prev;
    });
  };

  const triggerLockdown = () => {
    setLockdownOpen(true);
    setLockdownCountdown(14);
    const t = setInterval(() => {
      setLockdownCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          api.securityLockdown().then(() => handleLogout());
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Top bar */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-xl font-bold">Secure Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Session</span>
          <div className="relative">
            <button
              type="button"
              onClick={openNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-700"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-medium">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] overflow-hidden bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <button type="button" onClick={() => setNotificationsOpen(false)} className="p-1 hover:bg-gray-700 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-400 text-sm text-center">No notifications</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-700/50 hover:bg-gray-700/30">
                          <p className="font-semibold text-white text-sm">{n.title}</p>
                          <p className="text-gray-400 text-sm mt-0.5">{n.message}</p>
                          <p className="text-gray-500 text-xs mt-1">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
            {userName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>
      </nav>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Welcome back, {userName || "User"}!</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Profile Information */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Profile Information</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-400">Username</dt><dd>{profile?.username ?? userName}</dd></div>
              <div><dt className="text-gray-400">Email</dt><dd>{profile?.email ?? userEmail}</dd></div>
              <div><dt className="text-gray-400">Role</dt><dd className="capitalize">{profile?.role ?? "user"}</dd></div>
              <div><dt className="text-gray-400">Member Since</dt><dd>{profile?.memberSince ?? "—"}</dd></div>
            </dl>
            <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">
              EDIT PROFILE
            </button>
          </div>

          {/* Current Session */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Current Session</h3>
            </div>
            {currentSession ? (
              <>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-gray-400">Device Type</dt><dd>{currentSession.deviceType}</dd></div>
                  <div><dt className="text-gray-400">Browser</dt><dd>{currentSession.browser}</dd></div>
                  <div><dt className="text-gray-400">Operating System</dt><dd>{currentSession.os}</dd></div>
                  <div><dt className="text-gray-400">IP Address</dt><dd className="text-indigo-400">{currentSession.ip}</dd></div>
                  <div><dt className="text-gray-400">Location</dt><dd className="text-indigo-400">{currentSession.location}</dd></div>
                  <div><dt className="text-gray-400">Session Started</dt><dd>{currentSession.firstSeen ? new Date(currentSession.firstSeen).toLocaleString() : "—"}</dd></div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSessionsModalOpen(true)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-lg font-medium"
                  >
                    VIEW ALL SESSIONS
                  </button>
                  <button
                    onClick={handleEndOtherSessions}
                    className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                  >
                    END OTHER SESSIONS
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm">No session data.</p>
            )}
          </div>

          {/* Security Overview */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Security Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{securityOverview?.loginAttempts24h ?? 0}</div>
                <div className="text-xs text-gray-400">LOGIN ATTEMPTS</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{securityOverview?.failedAttempts24h ?? 0}</div>
                <div className="text-xs text-gray-400">FAILED ATTEMPTS</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold">24h</div>
                <div className="text-xs text-gray-400">LAST LOGIN</div>
              </div>
              <div className="bg-indigo-600/30 rounded-lg p-3 text-center col-span-2">
                <div className="text-2xl font-bold">{securityOverview?.securityScore ?? 98}%</div>
                <div className="text-xs text-gray-400">SECURITY SCORE</div>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Two-Factor Authentication</span><span className="text-green-400">{securityOverview?.twoFactorEnabled ? "ENABLED" : "DISABLED"}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Email Verification</span><span className="text-green-400">{securityOverview?.emailVerified ? "VERIFIED" : "—"}</span></div>
              {securityOverview?.passwordExpiresAt && (
                <div className="flex justify-between"><span className="text-gray-400">Password Expires</span><span>{new Date(securityOverview.passwordExpiresAt).toLocaleDateString()} ({securityOverview.daysUntilPasswordExpiry} days)</span></div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={openSecurityLogs} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-lg font-medium text-sm">
                SECURITY LOGS
              </button>
              <a href="/forgotpassword" className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm text-center">
                CHANGE PASSWORD
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Login Analytics */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Login Analytics</h3>
            </div>
            {loginAnalytics && (
              <>
                <div className="h-32 flex items-end gap-1 mb-4">
                  {loginAnalytics.chartData?.slice(-12).map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-600 rounded-t min-h-[4px]"
                      style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...loginAnalytics.chartData.map((x) => x.count)))) * 100)}%` }}
                      title={`${d.month}: ${d.count}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">TOTAL LOGINS</span><br /><span className="font-bold">{loginAnalytics.totalLogins}</span></div>
                  <div><span className="text-gray-400">THIS WEEK</span><br /><span className="font-bold">{loginAnalytics.thisWeek}</span></div>
                  <div><span className="text-gray-400">AVG/DAY</span><br /><span className="font-bold">{loginAnalytics.avgPerDay}</span></div>
                  <div><span className="text-gray-400">SUCCESS RATE</span><br /><span className="font-bold">{loginAnalytics.successRate}%</span></div>
                </div>
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
            <ul className="space-y-3">
              {recentActivities.slice(0, 5).map((a, i) => (
                <li key={i} className="text-sm flex justify-between items-start">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-gray-400 text-xs">{formatRelativeTime(a.createdAt)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${a.status === "ACTIVE" ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-300"}`}>{a.status}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button onClick={openActivityHistory} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm">
                VIEW ALL ACTIVITY
              </button>
              <button onClick={downloadCsv} className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm">
                DOWNLOAD LOGS
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button onClick={downloadCsv} className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium flex items-center gap-2">
                <Download className="w-4 h-4" /> EXPORT DATA
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> SUPPORT
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
              <div>Account Created: {profile?.memberSince ?? "—"}</div>
              <div>Data Usage: —</div>
              <div>Storage Used: —</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {sessionsModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5" /> Device & Session Management
              </h3>
              <button onClick={() => setSessionsModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-indigo-600/30 rounded-lg p-3 text-center"><div className="text-xl font-bold">{sessions.length}</div><div className="text-xs">Total Devices</div></div>
                <div className="bg-gray-700 rounded-lg p-3 text-center"><div className="text-xl font-bold">{sessions.filter((s) => s.isCurrent).length || 1}</div><div className="text-xs">Active Now</div></div>
                <div className="bg-gray-700 rounded-lg p-3 text-center"><div className="text-xl font-bold">{sessions.length - 1}</div><div className="text-xs">Inactive</div></div>
              </div>
              <p className="text-sm text-gray-400 mb-4">Review your devices regularly and revoke access for any device you don&apos;t recognize.</p>
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div key={s.sessionId} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{s.deviceType} Computer</div>
                          <div className="text-sm text-gray-400">{s.browser} on {s.os}</div>
                        </div>
                      </div>
                      {s.isCurrent ? <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded text-sm">THIS DEVICE</span> : <button className="text-red-400 text-sm font-medium">SIGN OUT</button>}
                    </div>
                    <dl className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-400">
                      <div>IP: {s.ip}</div>
                      <div>First Seen: {new Date(s.firstSeen).toLocaleDateString()}</div>
                      <div>Location: {s.location}</div>
                      <div>Last Active: {formatRelativeTime(s.lastActive)}</div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-2 justify-end">
              <button onClick={handleEndOtherSessions} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">END OTHER SESSIONS</button>
              <button onClick={() => setSessionsModalOpen(false)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {securityLogsModalOpen && securityLogs && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Security Logs ({securityLogs.events?.length ?? 0} Events)</h3>
              <button onClick={() => setSecurityLogsModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="text-sm">
                  <div className="font-medium">Security Summary:</div>
                  <div>Total Events: {securityLogs.summary?.totalEvents ?? 0} | Login Events: {securityLogs.summary?.loginEvents ?? 0} | Security Alerts: {securityLogs.summary?.securityAlerts ?? 0} | Password Changes: {securityLogs.summary?.passwordChanges ?? 0}</div>
                </div>
              </div>
              <div className="space-y-3">
                {securityLogs.events?.map((e, i) => (
                  <div key={i} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-sm text-gray-400">IP: {e.ip} | {e.source} | {formatRelativeTime(e.createdAt)}</div>
                    <div className="text-sm mt-1">{e.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-center">
              <button onClick={() => setSecurityLogsModalOpen(false)} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg">CLOSE</button>
            </div>
          </div>
        </div>
      )}

      {activityHistoryModalOpen && activityHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Complete Activity History ({activityHistory.activities?.length ?? 0} Events)</h3>
              <button onClick={() => setActivityHistoryModalOpen(false)} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4 text-sm">
                <div className="font-medium">Activity Summary:</div>
                <div>Total Events: {activityHistory.summary?.totalEvents ?? 0} | Logins: {activityHistory.summary?.logins ?? 0} | Security Events: {activityHistory.summary?.securityEvents ?? 0} | Password Changes: {activityHistory.summary?.passwordChanges ?? 0}</div>
              </div>
              <div className="space-y-3">
                {activityHistory.activities?.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-700/50">
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm">i</div>
                    <div className="flex-1">
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-gray-400">{a.description}</div>
                      <div className="text-xs text-gray-500 mt-1">IP: {a.ip || "System"} | {formatRelativeTime(a.createdAt)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${a.status === "ACTIVE" ? "bg-green-900/50 text-green-400" : "bg-gray-600 text-gray-300"}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-2 justify-center">
              <button onClick={() => setActivityHistoryModalOpen(false)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg">CLOSE</button>
              <button onClick={downloadCsv} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">DOWNLOAD CSV</button>
            </div>
          </div>
        </div>
      )}

      {sessionExpiringOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700 text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> Session Expiring Soon
            </h3>
            <p className="mt-2 text-gray-400">Your session will expire in <strong>{sessionCountdown}</strong> seconds.</p>
            <p className="mt-2 text-sm text-gray-400">Click &quot;Stay Logged In&quot; to extend your session, or &quot;Logout&quot; to end it now.</p>
            <p className="mt-2 text-xs text-gray-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Sessions automatically expire for your protection.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={handleStayLoggedIn} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">
                STAY LOGGED IN
              </button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium">
                LOGOUT NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {lockdownOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-red-900 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-red-400">SECURITY LOCKDOWN INITIATED</h3>
            <p className="mt-2 text-gray-300">Suspicious activity has been detected. All sessions will be terminated in <strong>{lockdownCountdown}</strong> seconds.</p>
            <p className="mt-2 text-sm text-gray-400">Detected: RAPID CLICKING, DEVICE FINGERPRINT CHANGE</p>
            <p className="mt-2 text-sm text-gray-400">If this was not you, please contact support. You will be redirected to the login page.</p>
            <button onClick={() => { api.securityLockdown(); handleLogout(); }} className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium">
              CONTINUE TO SECURE LOGIN
            </button>
          </div>
        </div>
      )}

      {/* Optional: demo button to trigger lockdown (remove in production) */}
      <div className="fixed bottom-4 right-4">
        <button onClick={triggerLockdown} className="text-xs text-gray-500 hover:text-red-400">Demo: Security Lockdown</button>
      </div>
    </div>
  );
};

export default Dashboard;
