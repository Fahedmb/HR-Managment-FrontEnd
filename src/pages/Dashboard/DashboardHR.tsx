import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { Users, FileText, Briefcase, CheckSquare, BarChart3, TrendingUp, Clock, Calendar, Download } from "lucide-react";
import { kpiApi, leaveApi, usersApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";
import type { HrKpiDashboard } from "../../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: { title: string; value: string | number; subtitle?: string; icon: any; color: string; trend?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.3 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-6 flex items-start gap-4">
    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
      <p className="text-2xl font-bold text-black dark:text-white mt-0.5">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      {trend !== undefined && (
        <span className={`text-xs font-medium ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>{trend >= 0 ? "+" : ""}{trend}% vs last month</span>
      )}
    </div>
  </motion.div>
);

const DashboardHR: React.FC = () => {
  const { user } = useAuth();
  const [kpi, setKpi] = useState<HrKpiDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kpiApi.getHr().then(res => { setKpi(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const exportPDF = () => {
    if (!kpi) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text("HRPRO - HR Dashboard Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()} | By: ${user?.firstName} ${user?.lastName}`, 14, 28);
    doc.setDrawColor(30, 64, 175);
    doc.line(14, 32, 196, 32);

    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Value"]],
      body: [
        ["Total Employees", kpi.totalEmployees],
        ["HR Users", kpi.totalHrUsers],
        ["Managers", kpi.totalManagers],
        ["Active Projects", kpi.activeProjects],
        ["Total Tasks", kpi.totalTasks],
        ["Completed Tasks", kpi.completedTasks],
        ["Task Completion Rate", `${kpi.taskCompletionRate?.toFixed(1)}%`],
        ["Pending Leave Requests", kpi.pendingLeaveRequests],
        ["Approved Leave Requests", kpi.approvedLeaveRequests],
        ["Upcoming Meetings", kpi.upcomingMeetings],
        ["Avg Performance Score", kpi.avgPerformanceScore],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 64, 175] },
      alternateRowStyles: { fillColor: [240, 245, 255] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: finalY,
      head: [["Department", "Employee Count"]],
      body: Object.entries(kpi.departmentBreakdown || {}).map(([k, v]) => [k, v]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save("HRPRO-Dashboard-Report.pdf");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const deptLabels = Object.keys(kpi?.departmentBreakdown || {});
  const deptValues = Object.values(kpi?.departmentBreakdown || {});
  const leaveTypeLabels = Object.keys(kpi?.leaveByType || {});
  const leaveTypeValues = Object.values(kpi?.leaveByType || {});
  const taskStatusLabels = Object.keys(kpi?.tasksByStatus || {});
  const taskStatusValues = Object.values(kpi?.tasksByStatus || {});
  const projectStatusLabels = Object.keys(kpi?.projectsByStatus || {});
  const projectStatusValues = Object.values(kpi?.projectsByStatus || {});

  return (
    <>
      <Breadcrumb pageName="HR Dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Welcome back, {user?.firstName}!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Here is your organization overview for today.</p>
        </div>
        <motion.button onClick={exportPDF} whileTap={{ scale: 0.97 }} className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
          <Download className="w-4 h-4" />Export PDF
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Employees" value={kpi?.totalEmployees ?? 0} subtitle={`${kpi?.totalManagers ?? 0} managers  ${kpi?.totalHrUsers ?? 0} HR`} icon={Users} color="bg-blue-500" />
        <StatCard title="Active Projects" value={kpi?.activeProjects ?? 0} subtitle={`${kpi?.totalProjects ?? 0} total  ${kpi?.completedProjects ?? 0} completed`} icon={Briefcase} color="bg-indigo-500" />
        <StatCard title="Task Completion" value={`${(kpi?.taskCompletionRate ?? 0).toFixed(1)}%`} subtitle={`${kpi?.completedTasks ?? 0} / ${kpi?.totalTasks ?? 0} tasks done`} icon={CheckSquare} color="bg-green-500" />
        <StatCard title="Pending Leaves" value={kpi?.pendingLeaveRequests ?? 0} subtitle={`${kpi?.approvedLeaveRequests ?? 0} approved this year`} icon={FileText} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard title="Total Teams" value={kpi?.totalTeams ?? 0} icon={Users} color="bg-purple-500" />
        <StatCard title="Upcoming Meetings" value={kpi?.upcomingMeetings ?? 0} subtitle={`${kpi?.totalMeetings ?? 0} total scheduled`} icon={Calendar} color="bg-cyan-500" />
        <StatCard title="Overdue Tasks" value={kpi?.overdueTasks ?? 0} icon={Clock} color="bg-red-500" />
        <StatCard title="Avg Performance" value={kpi?.avgPerformanceScore ? kpi.avgPerformanceScore.toFixed(1) : "N/A"} subtitle={`${kpi?.evaluationsThisYear ?? 0} evaluations this year`} icon={TrendingUp} color="bg-teal-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" />Employees by Department</h3>
          <ReactApexChart options={{ chart:{ type:"bar", toolbar:{show:false} }, plotOptions:{ bar:{ borderRadius:6, distributed:true, columnWidth:"55%" } }, colors:["#3B82F6","#6366F1","#8B5CF6","#EC4899","#F59E0B","#10B981","#14B8A6","#F97316"], dataLabels:{ enabled:false }, xaxis:{ categories:deptLabels, labels:{ style:{ colors:"#9CA3AF", fontSize:"11px" } } }, yaxis:{ labels:{ style:{ colors:"#9CA3AF" } } }, legend:{ show:false }, grid:{ borderColor:"#F3F4F6" }, tooltip:{ theme:"dark" } }} series={[{ name:"Employees", data:deptValues }]} type="bar" height={250} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" />Leave Requests by Type</h3>
          <ReactApexChart options={{ chart:{ type:"donut" }, colors:["#3B82F6","#10B981","#F59E0B","#EC4899","#8B5CF6","#F97316","#14B8A6","#6366F1"], labels:leaveTypeLabels, legend:{ position:"bottom", labels:{ colors:"#9CA3AF" } }, plotOptions:{ pie:{ donut:{ size:"65%" } } }, dataLabels:{ enabled:false }, tooltip:{ theme:"dark" } }} series={leaveTypeValues} type="donut" height={280} />
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" />Tasks by Status</h3>
          <ReactApexChart options={{ chart:{ type:"pie" }, colors:["#9CA3AF","#3B82F6","#8B5CF6","#10B981","#EF4444"], labels:taskStatusLabels, legend:{ position:"bottom", labels:{ colors:"#9CA3AF" } }, dataLabels:{ enabled:false }, tooltip:{ theme:"dark" } }} series={taskStatusValues} type="pie" height={260} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500" />Projects by Status</h3>
          <ReactApexChart options={{ chart:{ type:"radialBar" }, colors:["#9CA3AF","#3B82F6","#F59E0B","#10B981","#EF4444"], labels:projectStatusLabels, legend:{ show:true, position:"bottom", labels:{ colors:"#9CA3AF" } }, plotOptions:{ radialBar:{ hollow:{ size:"30%" }, dataLabels:{ total:{ show:true, label:"Total", color:"#6B7280" } } } }, tooltip:{ theme:"dark" } }} series={projectStatusValues.map((v, i, a) => Math.round((Number(v) / a.reduce((s, n) => s + Number(n), 0)) * 100) || 0)} type="radialBar" height={260} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-500" />Leave Summary</h3>
          <ReactApexChart options={{ chart:{ type:"bar", toolbar:{show:false} }, plotOptions:{ bar:{ horizontal:true, borderRadius:4, distributed:true } }, colors:["#F59E0B","#10B981","#EF4444","#9CA3AF"], dataLabels:{ enabled:true, style:{ fontSize:"11px", colors:["#fff"] } }, xaxis:{ categories:["Pending","Approved","Rejected","Cancelled"], labels:{ style:{ colors:"#9CA3AF" } } }, yaxis:{ labels:{ style:{ colors:"#9CA3AF" } } }, legend:{ show:false }, grid:{ borderColor:"#F3F4F6" }, tooltip:{ theme:"dark" } }} series={[{ name:"Count", data:[kpi?.pendingLeaveRequests??0, kpi?.approvedLeaveRequests??0, kpi?.rejectedLeaveRequests??0, 0] }]} type="bar" height={260} />
        </motion.div>
      </div>

      {/* Org Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4">Schedule Approval Summary</h3>
          <ReactApexChart options={{ chart:{ type:"donut" }, colors:["#F59E0B","#10B981","#EF4444"], labels:["Pending","Approved","Rejected"], legend:{ position:"bottom", labels:{ colors:"#9CA3AF" } }, dataLabels:{ enabled:false }, tooltip:{ theme:"dark" } }} series={[kpi?.pendingSchedules??0, kpi?.approvedSchedules??0, (kpi?.totalSchedulesSubmitted??0)-(kpi?.pendingSchedules??0)-(kpi?.approvedSchedules??0)]} type="donut" height={250} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-sm p-5">
          <h3 className="text-base font-semibold text-black dark:text-white mb-4">Projects by Department</h3>
          <ReactApexChart options={{ chart:{ type:"bar", toolbar:{show:false} }, plotOptions:{ bar:{ borderRadius:5, distributed:true } }, colors:["#6366F1","#3B82F6","#10B981","#F59E0B","#EC4899","#F97316","#14B8A6","#8B5CF6"], dataLabels:{ enabled:false }, xaxis:{ categories:Object.keys(kpi?.projectsByDepartment??{}), labels:{ style:{ colors:"#9CA3AF", fontSize:"11px" } } }, yaxis:{ labels:{ style:{ colors:"#9CA3AF" } } }, legend:{ show:false }, grid:{ borderColor:"#F3F4F6" }, tooltip:{ theme:"dark" } }} series={[{ name:"Projects", data:Object.values(kpi?.projectsByDepartment??{}) }]} type="bar" height={250} />
        </motion.div>
      </div>
    </>
  );
};

export default DashboardHR;
