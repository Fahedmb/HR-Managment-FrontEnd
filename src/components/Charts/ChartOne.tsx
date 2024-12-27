import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';

// Chart config
const initialOptions: ApexOptions = {
  colors: ['#3C50E0', '#80CAEE'],
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    height: 335,
    type: 'area',
    dropShadow: {
      enabled: true,
      color: '#623CEA14',
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: { show: false },
  },
  legend: {
    show: false,
    position: 'top',
    horizontalAlign: 'left',
  },
  responsive: [
    {
      breakpoint: 1024,
      options: { chart: { height: 300 } },
    },
    {
      breakpoint: 1366,
      options: { chart: { height: 350 } },
    },
  ],
  stroke: {
    width: [2, 2],
    curve: 'straight',
  },
  grid: {
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } },
  },
  dataLabels: { enabled: false },
  markers: {
    size: 4,
    colors: '#fff',
    strokeColors: ['#3056D3', '#80CAEE'],
    strokeWidth: 3,
    fillOpacity: 1,
    hover: { sizeOffset: 5 },
  },
  xaxis: {
    type: 'category',
    categories: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    min: 0,
  },
};

interface ChartSeries {
  name: string;
  data: number[];
}

const ChartOne: React.FC = () => {
  const [options, setOptions] = useState<ApexOptions>(initialOptions);

  const [series, setSeries] = useState<ChartSeries[]>([
    { name: 'Working Hours', data: new Array(12).fill(0) },
    { name: 'Leave Hours', data: new Array(12).fill(0) },
  ]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // call GET /api/chart-data
        const resp = await axios.get('http://localhost:9090/api/chart-data');
        // expect: { monthlyWorkingHours: number[], monthlyLeaveHours: number[] }
        const { monthlyWorkingHours, monthlyLeaveHours } = resp.data;

        // update state => series
        setSeries([
          {
            name: 'Working Hours',
            data: monthlyWorkingHours || [],
          },
          {
            name: 'Leave Hours',
            data: monthlyLeaveHours || [],
          },
        ]);
      } catch (err) {
        console.error('Error fetching chart data:', err);
      }
    };
    fetchChartData();
  }, []);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default 
                    dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        {/* Left side labels */}
        <div className="flex w-full flex-wrap gap-3 sm:gap-5">
          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center 
                             rounded-full border border-primary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-primary">Working Hours</p>
              <p className="text-sm font-medium">
                Year {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <div className="flex min-w-47.5">
            <span className="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center
                             rounded-full border border-secondary">
              <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
            </span>
            <div className="w-full">
              <p className="font-semibold text-secondary">Leave Hours</p>
              <p className="text-sm font-medium">
                Year {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>

        {/* (Optional) Right side: Day/Week/Month buttons */}
        <div className="flex w-full max-w-45 justify-end">
          <div className="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
            <button className="rounded bg-white py-1 px-3 text-xs font-medium text-black 
                               shadow-card hover:bg-white hover:shadow-card
                               dark:bg-boxdark dark:text-white dark:hover:bg-boxdark">
              Day
            </button>
            <button className="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white 
                               hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Week
            </button>
            <button className="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white 
                               hover:shadow-card dark:text-white dark:hover:bg-boxdark">
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;
