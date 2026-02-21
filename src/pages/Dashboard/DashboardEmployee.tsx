import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { CheckSquare, Clock, Calendar, Users, TrendingUp, Download, Briefcase, AlertTriangle } from "lucide-react";
import { kpiApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";
import { StatusBadge } from "../../components/ui/Alert";
import type { EmployeeKpiDashboard } from "../../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5 flex items-start gap-4">
    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-xl font-bold text-black dark:text-white mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </motion.div>
);

const DashboardEmployee: React.FC = () => {
  const { user } = useAuth();
  const [kpi, setKpi] = useState<EmployeeKpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    kpiApi.getEmployee(user.id).then(res => { setKpi(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const exportPDF = () => {
    if (!kpi || !user) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("HRPRO - My Dashboard Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Employee: ${kpi.employeeName} | Department: ${kpi.department} | ${new Date().toLocaleString()}`, 14, 28);
    doc.line(14, 32, 196, 32);
    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Value"]],
      body: [
        ["Total Tasks", kpi.myTotalTasks],
        ["Completed Tasks", kpi.myCompletedTasks],
        ["In Progress Tasks", kpi.myInProgressTasks],
        ["Overdue Tasks", kpi.myOverdueTasks],
        ["Leave Balance (days)", kpi.myLeaveBalance],
        ["Used Leave Days", kpi.myUsedLeaveDays],
        ["Pending Leave Requests", kpi.myPendingLeaveRequests],
        ["Meetings This Month", kpi.myMeetingsThisMonth],
        ["Performance Score", kpi.myPerformanceScore ?? "N/A"],
        ["Teams", kpi.myTeams?.join(", ") || "None"],
        ["Projects", kpi.myProjects?.join(", ") || "None"],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 64, 175] },
    });
    doc.save("HRPRO-My-Dashboard.pdf");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const taskData = [kpi?.myCompletedTasks??0, kpi?.myInProgressTasks??0, kpi?.myOverdueTasks??0, Math.max(0,(kpi?.myTotalTasks??0)-(kpi?.myCompletedTasks??0)-(kpi?.myInProgressTasks??0)-(kpi?.myOverdueTasks??0))];
  const completionPct = kpi?.myTotalTasks ? Math.round((kpi.myCompletedTasks/kpi.myTotalTasks)*100) : 0;

  return (
    <>
      <Breadcrumb pageName="My Dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Hello, {user?.firstName}!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi?.position}  {kpi?.department}</p>
        </div>
        <motion.button onClick={exportPDF} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
          <Download className="w-4 h-4" />Export PDF
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Tasks" value={kpi?.myTotalTasks??0} subtitle={`${completionPct}% complete`} icon={CheckSquare} color="bg-blue-500" />
        <StatCard title="Leave Balance" value={`${kpi?.myLeaveBalance??0} days`} subtitle={`${kpi?.myUsedLeaveDays??0} used this year`} icon={Calendar} color="bg-green-500" />
        <StatCard title="Meetings" value={kpi?.myMeetingsThisMonth??0} subtitle="This month" icon={Users} color="bg-purple-500" />
        <StatCard title="Performance" value={kpi?.myPerformanceScore ? kpi.myPerformanceScore.toFixed(1) : "N/A"} subtitle="Latest score" icon={TrendingUp} color="bg-amber-500" />
      </div>

      {kpi?.myOverdueTasks && kpi.myOverdueTasks > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 flex items-center gap-3 px-5 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>You have <strong>{kpi.myOverdueTasks}</strong> overdue {kpi.myOverdueTasks === 1 ? "task" : "tasks"}  please review them.</span>
        </motion.div>
      ) : null}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Task Breakdown</h3>
          <ReactApexChart options={{ chart:{ type:"donut" }, colors:["#10B981","#3B82F6","#EF4444","#D1D5DB"], labels:["Completed","In Progress","Overdue","Not Started"], legend:{ position:"bottom", labels:{ colors:"#9CA3AF" } }, dataLabels:{ enabled:false }, plotOptions:{ pie:{ donut:{ size:"65%", labels:{ show:true, total:{ show:true, label:"Total", color:"#6B7280", formatter:()=>String(kpi?.myTotalTasks??0) } } } } }, tooltip:{ theme:"dark" } }} series={taskData} type="donut" height={240} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-sm font-semibold text-black dark:text-white mb-4">Leave Usage Overview</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{kpi?.myLeaveBalance??0}</p>
              <p className="text-xs text-gray-500 mt-1">Remaining</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{kpi?.myUsedLeaveDays??0}</p>
              <p className="text-xs text-gray-500 mt-1">Used</p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{kpi?.myPendingLeaveRequests??0}</p>
              <p className="text-xs text-gray-500 mt-1">Pending</p>
            </div>
          </div>
          <ReactApexChart options={{ chart:{ type:"bar", toolbar:{show:false} }, plotOptions:{ bar:{ borderRadius:6, columnWidth:"50%" } }, colors:["#10B981","#3B82F6","#F59E0B"], dataLabels:{ enabled:false }, xaxis:{ categories:["Leave Balance","Used Days","Pending"], labels:{ style:{ colors:"#9CA3AF" } } }, yaxis:{ labels:{ style:{ colors:"#9CA3AF" } } }, legend:{ show:false }, grid:{ borderColor:"#F3F4F6" }, tooltip:{ theme:"dark" } }} series={[{ name:"Days", data:[kpi?.myLeaveBalance??0, kpi?.myUsedLeaveDays??0, kpi?.myPendingLeaveRequests??0] }]} type="bar" height={150} />
        </motion.div>
      </div>

      {/* Teams & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-sm font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" />My Teams</h3>
          {kpi?.myTeams?.length ? (
            <div className="space-y-2">
              {kpi.myTeams.map((t: string, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-stroke dark:border-strokedark last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-black dark:text-white">{t}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Not assigned to any teams yet.</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-sm font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500" />My Projects</h3>
          {kpi?.myProjects?.length ? (
            <div className="space-y-2">
              {kpi.myProjects.map((p: string, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-stroke dark:border-strokedark last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-sm text-black dark:text-white">{p}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">Not assigned to any projects yet.</p>}
        </motion.div>
      </div>
    </>
  );
};

export default DashboardEmployee;
