"use client";

import { useRouter } from "next/navigation";

export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
};

interface TableListProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowHref?: (row: T) => string;
  emptyMessage?: string;
}

export function TableList<T>({
  columns,
  data,
  getRowHref,
  emptyMessage = "No items found.",
}: TableListProps<T>) {
  const router = useRouter();

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand-header border-b border-brand-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-200/50">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => getRowHref && router.push(getRowHref(row))}
                className={
                  getRowHref
                    ? "cursor-pointer hover:bg-brand-50 transition-colors"
                    : ""
                }
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-gray-700">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
