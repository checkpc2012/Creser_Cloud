"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { cn } from "@/lib/utils"

interface VirtualTableProps<T> {
    data: T[]
    columns: {
        header: string
        cell: (item: T) => React.ReactNode
        width?: string
    }[]
    rowHeight?: number
    className?: string
    loading?: boolean
    onRowClick?: (item: T) => void
}

export function VirtualTable<T>({
    data,
    columns,
    rowHeight = 50,
    className,
    loading = false,
    onRowClick
}: VirtualTableProps<T>) {
    const parentRef = React.useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
    })

    return (
        <div
            ref={parentRef}
            className={cn("relative h-[400px] w-full overflow-auto rounded-md border bg-card", className)}
        >
            {loading ? (
                <div className="p-4 space-y-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-10 w-full bg-muted/20 animate-pulse rounded" />
                    ))}
                </div>
            ) : (
                <div
                    className="relative w-full"
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                    }}
                >
                    {/* Table Header - Sticky */}
                    <div className="sticky top-0 z-10 flex w-full border-b bg-muted/95 backdrop-blur">
                        {columns.map((col, i) => (
                            <div
                                key={i}
                                className="flex h-10 items-center px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
                            >
                                {col.header}
                            </div>
                        ))}
                    </div>

                    {/* virtual rows */}
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const item = data[virtualRow.index]
                        return (
                            <div
                                key={virtualRow.key}
                                className={cn(
                                    "absolute left-0 flex w-full border-b last:border-0 hover:bg-muted/30 transition-colors",
                                    onRowClick && "cursor-pointer"
                                )}
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    top: 40, // Height of header
                                }}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((col, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center px-4 text-sm"
                                        style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
                                    >
                                        {col.cell(item)}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
            {!loading && data.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                    No se encontraron registros.
                </div>
            )}
        </div>
    )
}
