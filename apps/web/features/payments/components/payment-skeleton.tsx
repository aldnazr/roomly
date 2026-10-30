"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function PaymentSkeleton() {
  return (
    <div className="mx-auto max-w-xl">
      <Skeleton className="mb-5 h-11 w-32" />
      <div className="space-y-4">
        <Card className="gap-5 py-0 shadow-sm">
          <CardHeader className="border-b py-5 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-5 pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="mx-auto h-9 w-24" />
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-9 w-24" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
