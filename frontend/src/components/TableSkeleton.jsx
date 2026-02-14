export default function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="pb-3 pr-3">
                <span className="inline-block h-4 w-24 rounded bg-surface-700 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border/50">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-3 pr-3">
                  <span
                    className="inline-block h-4 rounded bg-surface-800 animate-pulse"
                    style={{ width: colIdx === 0 ? "80%" : "60%" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
