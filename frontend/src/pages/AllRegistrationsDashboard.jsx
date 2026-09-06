import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import {
  GraduationCap,
  Users,
  Layers,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

const PAGE_SIZE = 30;

const CLUSTER_COLORS = {
  CC1: "bg-red-100 text-red-700 border-red-200",
  CC2: "bg-orange-100 text-orange-700 border-orange-200",
  CC3: "bg-amber-100 text-amber-700 border-amber-200",
  CC4: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CC5: "bg-lime-100 text-lime-700 border-lime-200",
  CC6: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CC7: "bg-teal-100 text-teal-700 border-teal-200",
  CC8: "bg-blue-100 text-blue-700 border-blue-200",
  CC9: "bg-purple-100 text-purple-700 border-purple-200",
  CC10: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  CC11: "bg-rose-100 text-rose-700 border-rose-200",
  Unassigned: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function AllRegistrationsDashboard() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [info, setInfo] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  // Unique clusters from registrations
  const availableClusters = [
    "All",
    ...Array.from(new Set(registrations.map((r) => r.cluster))).sort(),
  ];

  useEffect(() => {
    if (!token) {
      setError("No access token provided. Please use the link shared by your administrator.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [token]);

  useEffect(() => {
    const q = search.toLowerCase();
    const results = registrations.filter((r) => {
      const matchSearch =
        !q ||
        r.fullName?.toLowerCase().includes(q) ||
        r.college?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phoneNumber?.includes(q) ||
        r.cluster?.toLowerCase().includes(q);
      const matchCluster = clusterFilter === "All" || r.cluster === clusterFilter;
      return matchSearch && matchCluster;
    });
    setFiltered(results);
    setPage(1);
  }, [search, clusterFilter, registrations]);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [infoRes, regRes] = await Promise.all([
        api.get(`/clusters/global-view?token=${token}`),
        api.get(`/clusters/global-view/registrations?token=${token}`),
      ]);
      setInfo(infoRes.data);
      setRegistrations(regRes.data);
      setFiltered(regRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("This link is invalid or has been revoked. Please contact your administrator for a new link.");
      } else {
        setError(err.response?.data?.message || "Failed to load data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await api.get(`/clusters/global-view/export?token=${token}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "all-clusters-registrations.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // silent
    } finally {
      setDownloading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading all registrations…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center space-y-4 border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-800">Access Denied</h1>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F8] font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-slate-300 bg-white/10 px-3 py-1 rounded-full inline-block mb-2">
                Festival of Independence · IYF Kolkata
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                All Registrations
              </h1>
              <p className="text-slate-300 font-semibold mt-1">
                Global View — All {info?.totalClusters ?? 10} Clusters Combined
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 bg-white text-slate-800 hover:bg-slate-100 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? "Generating…" : "Download Excel"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Registrations</p>
              <p className="text-3xl font-black text-gray-800">{registrations.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Clusters</p>
              <p className="text-3xl font-black text-gray-800">{info?.totalClusters ?? "—"}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtered Results</p>
              <p className="text-3xl font-black text-gray-800">{filtered.length}</p>
            </div>
          </div>
        </div>

        {/* Cluster breakdown pills */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Registrations by Cluster</p>
          <div className="flex flex-wrap gap-2">
            {["CC1","CC2","CC3","CC4","CC5","CC6","CC7","CC8","CC9","CC10","CC11"].map((code) => {
              const count = registrations.filter((r) => r.cluster === code).length;
              return (
                <button
                  key={code}
                  onClick={() => setClusterFilter(clusterFilter === code ? "All" : code)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    clusterFilter === code
                      ? "ring-2 ring-offset-1 ring-slate-400 " + (CLUSTER_COLORS[code] || CLUSTER_COLORS["Unassigned"])
                      : CLUSTER_COLORS[code] || CLUSTER_COLORS["Unassigned"]
                  }`}
                >
                  {code}: {count}
                </button>
              );
            })}
            {registrations.some((r) => r.cluster === "Unassigned") && (
              <button
                onClick={() => setClusterFilter(clusterFilter === "Unassigned" ? "All" : "Unassigned")}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  clusterFilter === "Unassigned" ? "ring-2 ring-offset-1 ring-slate-400 " : ""
                }${CLUSTER_COLORS["Unassigned"]}`}
              >
                Unassigned: {registrations.filter((r) => r.cluster === "Unassigned").length}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
            <h2 className="text-base font-black text-gray-800">
              All Registrations
              <span className="ml-2 text-xs font-bold text-gray-400">({filtered.length} of {registrations.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              {clusterFilter !== "All" && (
                <button
                  onClick={() => setClusterFilter("All")}
                  className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-all"
                >
                  Clear filter ✕
                </button>
              )}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, college, cluster…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No registrations found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cluster</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">College</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800">{student.fullName}</p>
                          <p className="text-xs text-gray-400 font-mono">{student.id.slice(0, 8)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${CLUSTER_COLORS[student.cluster] || CLUSTER_COLORS["Unassigned"]}`}>
                            {student.cluster}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">
                          {student.college}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{student.phoneNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            student.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {student.paymentStatus === "Paid" && <CheckCircle2 className="w-3 h-3" />}
                            {student.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(student.registeredOn).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">
                    Page {page} of {totalPages} · {filtered.length} results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Festival of Independence · IYF Kolkata · Live data from database
        </p>
      </div>
    </div>
  );
}
