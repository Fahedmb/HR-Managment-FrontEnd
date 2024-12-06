import React from 'react';

type RequestItem = {
  name: string;
  date: string;
  status: string;
  type: string;
};

type TableThreeProps = {
  requests: RequestItem[];
};

const TableThree: React.FC<TableThreeProps> = ({ requests }) => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
              Request
            </th>
            <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
              Date
            </th>
            <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
              Status
            </th>
            <th className="py-4 px-4 font-medium text-black dark:text-white">
              Type
            </th>
          </tr>
          </thead>
          <tbody>
          {requests.map((item, key) => (
            <tr key={key}>
              <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                <h5 className="font-medium text-black dark:text-white">
                  {item.name}
                </h5>
              </td>
              <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">
                  {item.date}
                </p>
              </td>
              <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                <p
                  className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                    item.status === 'APPROVED'
                      ? 'bg-success text-success'
                      : item.status === 'REJECTED'
                        ? 'bg-danger text-danger'
                        : 'bg-warning text-warning'
                  }`}
                >
                  {item.status}
                </p>
              </td>
              <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                <p className="text-black dark:text-white">{item.type}</p>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableThree;
