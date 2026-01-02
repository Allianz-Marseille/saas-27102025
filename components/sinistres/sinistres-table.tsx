/**
 * Composant tableau pour afficher les sinistres
 * Utilise @tanstack/react-table pour le tri et la pagination
 */

"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  UserPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Sinistre, SinistreStatus, SinistreRoute } from "@/types/sinistre";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getRouteLabel, getRouteBadgeColor, getStatusBadgeColor } from "@/lib/utils/sinistres-utils";

interface SinistresTableProps {
  sinistres: Sinistre[];
  onView?: (sinistre: Sinistre) => void;
  onEdit?: (sinistre: Sinistre) => void;
  onAssign?: (sinistre: Sinistre) => void;
}


export function SinistresTable({
  sinistres,
  onView,
  onEdit,
  onAssign,
}: SinistresTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Sinistre>[] = useMemo(
    () => [
      {
        accessorKey: "clientLagonNumber",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Numéro Lagon
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("clientLagonNumber") || "-"}</div>
        ),
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Nom Client
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>{row.getValue("clientName") || "-"}</div>
        ),
      },
      {
        accessorKey: "policyNumber",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Numéro Contrat
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>{row.getValue("policyNumber") || "-"}</div>
        ),
      },
      {
        accessorKey: "claimNumber",
        header: "Sinistre",
        cell: ({ row }) => (
          <div>{row.getValue("claimNumber") || "-"}</div>
        ),
      },
      {
        accessorKey: "policyCategory",
        header: "Société",
        cell: ({ row }) => (
          <div>{row.getValue("policyCategory") || "-"}</div>
        ),
      },
      {
        accessorKey: "route",
        header: "Route",
        cell: ({ row }) => {
          const route = row.getValue("route") as SinistreRoute | undefined;
          return (
            <Badge className={cn("text-xs", getRouteBadgeColor(route))}>
              {getRouteLabel(route)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => {
          const status = row.getValue("status") as SinistreStatus | undefined;
          return (
            <Badge className={cn("text-xs", getStatusBadgeColor(status))}>
              {status || "Non défini"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Montant Total
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue("totalAmount") as number;
          return formatCurrency(amount || 0);
        },
      },
      {
        accessorKey: "remainingAmount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2"
            >
              Reste à Payer
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = row.getValue("remainingAmount") as number;
          return formatCurrency(amount || 0);
        },
      },
      {
        accessorKey: "damagedCoverage",
        header: "Garanties Sinistrées",
        cell: ({ row }) => {
          const coverage = row.getValue("damagedCoverage") as string;
          return <div className="text-sm">{coverage || "-"}</div>;
        },
      },
      {
        accessorKey: "assignedToEmail",
        header: "Affecté à",
        cell: ({ row }) => {
          const assigned = row.getValue("assignedToEmail") as string | undefined;
          return assigned || (
            <span className="text-muted-foreground text-sm">À affecter</span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const sinistre = row.original;
          return (
            <div className="flex items-center gap-2">
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(sinistre)}
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(sinistre)}
                  title="Modifier"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onAssign && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAssign(sinistre)}
                  title="Affecter"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onAssign]
  );

  const table = useReactTable({
    data: sinistres,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun sinistre trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} sinistre(s) au total
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} sur{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

