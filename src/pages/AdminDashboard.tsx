import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  LogOut, 
  RefreshCw,
  Shield,
  Mail,
  MapPin,
  Globe,
  Monitor,
  UserCog,
} from "lucide-react";
import { ToastContext } from "../context/ToastContext";

const API_BASE = "http://localhost:8000/api";

interface ActivityItem {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  description: string;
  ipAddress: string | null;
  location: string | null;
  created_at: string;
}

interface ActivityStats {
  totalActivities: number;
  totalUsers: number;
  recentActivities: number;
  activitiesByAction: Array<{ _id: string; count: number }>;
  topUsers: Array<{ _id: string; userName: string; count: number }>;
}

interface SessionItem {
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  deviceType: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  firstSeen: string;
}

interface UserItem {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"activities" | "sessions" | "users">("activities");
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useContext(ToastContext);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const currentUserId = token ? (() => {
    try {
      const base64 = token.split(".")[1];
      const json = atob(base64);
      return JSON.parse(json).id;
    } catch { return null; }
  })() : null;

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/activities?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setTotalPages(data.pagination?.pages ?? 1);
      } else if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [token, page, navigate]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else if (res.status === 401 || res.status === 403) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  }, [token, navigate]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 401 || res.status === 403) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token || userRole !== "admin") {
      navigate("/login");
      return;
    }
    fetchActivities();
    fetchStats();
    fetchSessions();
    fetchUsers();
  }, [token, userRole, navigate, page, fetchActivities, fetchStats, fetchSessions, fetchUsers]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("sessionId");
    navigate("/login");
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!token || userId === currentUserId) return;
    setRoleUpdating(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
        toast?.success("User role updated successfully.");
      } else {
        toast?.error(data.message || "Failed to update role");
      }
    } catch (e) {
      toast?.error("Failed to update role");
    } finally {
      setRoleUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: "bg-green-100 text-green-800",
      REGISTER: "bg-blue-100 text-blue-800",
      OTP_VERIFIED: "bg-purple-100 text-purple-800",
      PASSWORD_RESET: "bg-orange-100 text-orange-800",
      PASSWORD_RESET_REQUEST: "bg-yellow-100 text-yellow-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - dynamic from API */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? "—" : (stats?.totalActivities ?? "—")}
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? "—" : (stats?.totalUsers ?? "—")}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 24 Hours</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? "—" : (stats?.recentActivities ?? "—")}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activity Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {statsLoading ? "—" : (stats?.activitiesByAction?.length ?? "—")}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs: Activities | Devices (Sessions) | User Management */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === "activities" ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow hover:bg-gray-50"}`}
          >
            <Activity className="w-4 h-4" /> All Activities
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === "sessions" ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow hover:bg-gray-50"}`}
          >
            <Monitor className="w-4 h-4" /> Devices Logged In
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow hover:bg-gray-50"}`}
          >
            <UserCog className="w-4 h-4" /> User Management
          </button>
        </div>

        {/* Activities Table */}
        {activeTab === "activities" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Users&apos; Activities</h2>
            <button
              onClick={() => { setPage(1); fetchActivities(); fetchStats(); fetchSessions(); fetchUsers(); toast?.success("Data refreshed."); }}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No activities found</td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{activity.userName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{activity.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(activity.action)}`}>{activity.action}</span>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{activity.description}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.location ? <div className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="w-4 h-4" />{activity.location}</div> : <span className="text-sm text-gray-400">Unknown</span>}
                        {activity.ipAddress && <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><Globe className="w-3 h-3" />{activity.ipAddress}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
        )}

        {/* Devices / Sessions Table */}
        {activeTab === "sessions" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Devices Logged In</h2>
            <button onClick={() => { fetchSessions(); }} className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device / Browser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP / Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No sessions found</td></tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.sessionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{s.userName}</div>
                        <div className="text-xs text-gray-500">{s.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${s.userRole === "admin" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>{s.userRole}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{s.deviceType} — {s.browser} on {s.os}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.ip}<br /><span className="text-xs text-gray-500">{s.location}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(s.lastActive)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* User Management: change role */}
        {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Management — Change Roles</h2>
            <button onClick={() => fetchUsers()} className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"><RefreshCw className="w-4 h-4" /> Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${u.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"}`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u._id === currentUserId ? (
                          <span className="text-xs text-gray-400">(you)</span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={roleUpdating === u._id}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(u.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

