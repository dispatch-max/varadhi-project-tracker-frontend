"use client";

import { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Sparkles,
  Loader2,
  Users,
} from "lucide-react";

function ModalWrapper({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex justify-between items-start bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-violet-100 mt-1">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function ExportModal({ open, onClose, projects = [] }) {
  const [loadingType, setLoadingType] = useState(null);

  // Helper function to safely escape CSV fields containing commas or quotes
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const exportCSV = () => {
    setLoadingType("csv");

    const headers = ["Project Name", "Status", "Priority", "Manager", "End Date"];
    const rows = projects.map((p) => [
      escapeCSV(p.name || "Untitled"),
      escapeCSV(p.status || "N/A"),
      escapeCSV(p.priority || "Normal"),
      escapeCSV(p.manager?.name || "Unassigned"),
      escapeCSV(p.endDate ? new Date(p.endDate).toLocaleDateString() : "N/A"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setLoadingType(null);
      onClose();
    }, 400);
  };

  const exportExcel = () => {
    setLoadingType("excel");

    // Construct valid HTML Table format which Microsoft Excel opens cleanly
    const headers = ["Project Name", "Status", "Priority", "Manager", "End Date"];
    const rowsHtml = projects
      .map(
        (p) => `
      <tr>
        <td>${p.name || "Untitled"}</td>
        <td>${p.status || "N/A"}</td>
        <td>${p.priority || "Normal"}</td>
        <td>${p.manager?.name || "Unassigned"}</td>
        <td>${p.endDate ? new Date(p.endDate).toLocaleDateString() : "N/A"}</td>
      </tr>`
      )
      .join("");

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Projects</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold;">
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `projects_report_${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setLoadingType(null);
      onClose();
    }, 400);
  };

  const exportPDF = () => {
    setLoadingType("pdf");

    // Open a print window formatted cleanly for PDF saving
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate PDF report.");
      setLoadingType(null);
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Projects Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #4c1d95; margin-bottom: 5px; }
            p { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f3e8ff; color: #581c87; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Varadhi - Projects Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()} | Total Projects: ${projects.length}</p>
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Manager</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              ${projects
                .map(
                  (p) => `
                <tr>
                  <td><strong>${p.name || "Untitled"}</strong></td>
                  <td>${p.status ? p.status.replace("_", " ") : "N/A"}</td>
                  <td>${p.priority || "Normal"}</td>
                  <td>${p.manager?.name || "Unassigned"}</td>
                  <td>${p.endDate ? new Date(p.endDate).toLocaleDateString() : "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      setLoadingType(null);
      onClose();
    }, 400);
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Export Reports"
      subtitle="Download project reports in your desired format"
    >
      <div className="rounded-2xl  p-5 mb-6 flex gap-4">
        <div className="bg-violet-600 text-white p-3 rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
          <Sparkles />
        </div>

        <div>
          <h3 className="font-bold text-lg text-slate-900">Export Project Data</h3>
          <p className="text-sm text-slate-500">
            Select a format below to export all {projects.length} loaded projects.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* CSV Button */}
        <button
          onClick={exportCSV}
          disabled={loadingType !== null}
          className="rounded-2xl border border-slate-200 p-5 text-left hover:bg-violet-50 hover:border-violet-500 transition disabled:opacity-50"
        >
          <FileSpreadsheet className="text-emerald-600 mb-3" size={28} />
          <h4 className="font-semibold text-slate-800">CSV</h4>
          <p className="text-xs text-slate-500 mt-0.5">Standard comma-separated spreadsheet</p>

          <span className="mt-4 flex items-center text-violet-600 font-medium text-sm">
            {loadingType === "csv" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {loadingType === "csv" ? "Exporting..." : "Download"}
          </span>
        </button>

        {/* Excel Button */}
        <button
          onClick={exportExcel}
          disabled={loadingType !== null}
          className="rounded-2xl border border-slate-200 p-5 text-left hover:bg-emerald-50 hover:border-emerald-500 transition disabled:opacity-50"
        >
          <FileText className="text-emerald-600 mb-3" size={28} />
          <h4 className="font-semibold text-slate-800">Excel</h4>
          <p className="text-xs text-slate-500 mt-0.5">Formatted XLS spreadsheet document</p>

          <span className="mt-4 flex items-center text-emerald-600 font-medium text-sm">
            {loadingType === "excel" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {loadingType === "excel" ? "Exporting..." : "Download"}
          </span>
        </button>

        {/* PDF Button */}
        <button
          onClick={exportPDF}
          disabled={loadingType !== null}
          className="rounded-2xl border border-slate-200 p-5 text-left hover:bg-rose-50 hover:border-rose-500 transition disabled:opacity-50"
        >
          <File className="text-rose-600 mb-3" size={28} />
          <h4 className="font-semibold text-slate-800">PDF</h4>
          <p className="text-xs text-slate-500 mt-0.5">Printable document format</p>

          <span className="mt-4 flex items-center text-rose-600 font-medium text-sm">
            {loadingType === "pdf" ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Download size={16} className="mr-2" />
            )}
            {loadingType === "pdf" ? "Exporting..." : "Generate"}
          </span>
        </button>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 transition"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}

export function AnalyticsModal({ open, onClose, projects = [] }) {
  const total = projects.length;

  const active = projects.filter(
    (p) => p.status === "active" || p.status === "in_progress"
  ).length;

  const completed = projects.filter(
    (p) => p.status === "completed" || p.progress === 100
  ).length;

  const hold = projects.filter((p) => p.status === "on_hold").length;

  const completion = total ? Math.round((completed / total) * 100) : 0;

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Project Analytics"
      subtitle="Overview of your project progress"
    >
      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-sm font-medium text-slate-500">Total Projects</p>
          <h2 className="text-2xl font-bold text-violet-600 mt-1">{total}</h2>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-slate-500">Completed</p>
          <h2 className="text-2xl font-bold text-emerald-600 mt-1">{completed}</h2>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-slate-500">Completion Rate</p>
          <h2 className="text-2xl font-bold text-blue-600 mt-1">{completion}%</h2>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm font-semibold text-violet-700">{completion}%</span>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Status Distribution */}
      <div className="mt-6">
        <h3 className="font-semibold text-slate-800 mb-3">Status Breakdown</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Active / In Progress</span>
            </div>
            <span className="font-semibold text-slate-800">{active}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-600">Completed</span>
            </div>
            <span className="font-semibold text-slate-800">{completed}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">On Hold</span>
            </div>
            <span className="font-semibold text-slate-800">{hold}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}

export function TeamMembersModal({ open, onClose, members = [], projects = [] }) {
  const [search, setSearch] = useState("");

  // Derive unique team members from projects if explicit members list isn't provided
  const combinedMembers = useMemo(() => {
    if (members && members.length > 0) return members;

    const map = new Map();
    projects.forEach((p) => {
      if (p.manager?.name) {
        map.set(p.manager.name, {
          name: p.manager.name,
          email: p.manager.email || "Project Manager",
          role: "Manager",
        });
      }
      if (Array.isArray(p.members)) {
        p.members.forEach((m) => {
          if (m?.name) {
            map.set(m.name, {
              name: m.name,
              email: m.email || "Team Member",
              role: m.role || "Member",
            });
          }
        });
      }
    });

    return Array.from(map.values());
  }, [members, projects]);

  const filteredMembers = combinedMembers.filter((member) =>
    member.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Team Members"
      subtitle="Overview of project managers and contributors"
    >
      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members..."
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
      />

      {/* Members List */}
      <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:bg-slate-50/80 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {member.name?.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {member.name}
                  </h4>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-lg bg-violet-50 border border-violet-100 px-2.5 py-1 text-xs text-violet-700 font-medium">
                  {member.role}
                </span>

                <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1 justify-end font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No members found</p>
            <p className="text-xs mt-0.5">Try refining your search term.</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}