import { ApexOptions } from 'apexcharts';
import React, { useEffect, useState, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';

type ChartThreeProps = {
  onChartReady?: (dataUrl: string) => void;
};

const ChartThree: React.FC<ChartThreeProps> = ({ onChartReady }) => {
  const [workedDays, setWorkedDays] = useState<number>(0);
  const [leaveDays, setLeaveDays] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const chartRef = useRef<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id) setUserId(parsedUser.id);
        setToken(storedToken);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!userId || !token) {
      setIsLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:9090/api/analytics/${userId}?period=Monthly`, { headers });
        if (res.ok) {
          const data = await res.json();
          setWorkedDays(data.restDays);
          setLeaveDays(data.leaveDays);
        } else {
          setWorkedDays(0);
          setLeaveDays(0);
        }
      } catch {
        setWorkedDays(0);
        setLeaveDays(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, token]);

  const series = [workedDays, leaveDays];

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'donut',
    },
    colors: ['#3C50E0', '#F87171'],
    labels: ['Worked Days', 'Leave Days'],
    legend: {
      show: false,
      position: 'bottom',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          background: 'transparent',
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };

  useEffect(() => {
    if (!isLoading && chartRef.current && chartRef.current.chart && onChartReady) {
      // Give chart a slight delay to ensure rendering is complete
      setTimeout(() => {
        chartRef.current.chart.dataURI().then((uri: any) => {
          if (uri?.imgURI) {
            onChartReady(uri.imgURI);
          }
        });
      }, 500);
    }
  }, [isLoading, onChartReady]);

  return (
    <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5">
      <div className="mb-3 flex justify-between gap-4">
        <h5 className="text-xl font-semibold text-black dark:text-white">
          Work vs Leave (Monthly)
        </h5>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40 text-black dark:text-white">
          Loading...
        </div>
      ) : (
        <>
          <div className="mb-2">
            <div id="chartThree" className="mx-auto flex justify-center">
              <ReactApexChart
                ref={chartRef}
                options={options}
                series={series}
                type="donut"
              />
            </div>
          </div>

          <div className="-mx-8 flex flex-wrap items-center justify-center gap-y-3">
            <div className="sm:w-1/2 w-full px-8">
              <div className="flex w-full items-center">
                <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-primary"></span>
                <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                  <span>Worked Days</span>
                  <span>{workedDays}</span>
                </p>
              </div>
            </div>
            <div className="sm:w-1/2 w-full px-8">
              <div className="flex w-full items-center">
                <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#F87171]"></span>
                <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                  <span>Leave Days</span>
                  <span>{leaveDays}</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartThree;
