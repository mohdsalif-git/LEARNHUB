import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

const Table = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full overflow-x-auto", className)} {...props}>
    <table className="w-full caption-bottom text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/50">
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border last:border-0">
          <td className="px-4 py-3">Cell</td>
        </tr>
      </tbody>
    </table>
  </div>
));

Table.displayName = "Table";

export const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));

TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));

TableBody.displayName = "TableBody";

export const TableFooter = forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
));

TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
));

TableRow.displayName = "TableRow";

export const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("px-4 py-3 text-left font-medium text-muted-foreground", className)} {...props} />
));

TableHead.displayName = "TableHead";

export const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-3", className)} {...props} />
));

TableCell.displayName = "TableCell";

export const TableCaption = forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));

TableCaption.displayName = "TableCaption";

export const SortableHeader = forwardRef(({ children, onSort, sorted, direction, className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none",
      className
    )}
    onClick={onSort}
    {...props}
  >
    <div className="flex items-center gap-1">
      {children}
      {sorted && (
        direction === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
      {!sorted && <span className="h-4 w-4 opacity-30" />}
    </div>
  />
));

SortableHeader.displayName = "SortableHeader";

export const TablePagination = ({ page, pageCount, onPageChange, className }) => (
  <div className={cn("flex items-center justify-between p-4 border-t border-border", className)}>
    <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
      >
        Previous
      </button>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pageCount}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  </div>
);

export { Table };