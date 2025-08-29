import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, LayoutDashboard } from "lucide-react";

interface SpjDashboardProps {
  totalSpjGu: number;
  totalSpjLs: number;
  spjCountByBidang: { [key: string]: number };
}

export const SpjDashboard: React.FC<SpjDashboardProps> = ({
  totalSpjGu,
  totalSpjLs,
  spjCountByBidang,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jumlah SPJ GU</CardTitle>
          <FolderOpen className="h-4 w-4 text-primary-foreground/80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSpjGu}</div>
          <p className="text-xs text-primary-foreground/70">
            Total Surat Pertanggungjawaban Ganti Uang
          </p>
        </CardContent>
      </Card>
      <Card className="bg-accent text-accent-foreground">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jumlah SPJ LS</CardTitle>
          <FileText className="h-4 w-4 text-accent-foreground/80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSpjLs}</div>
          <p className="text-xs text-accent-foreground/70">
            Total Surat Pertanggungjawaban Langsung
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SPJ per Bidang</CardTitle>
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {Object.keys(spjCountByBidang).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(spjCountByBidang).map(([bidang, count]) => (
                <div key={bidang} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{bidang}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada data bidang.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};