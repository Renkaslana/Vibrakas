'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface ChartData {
  name: string
  total: number
  rank: number
}

interface TopSpendersChartProps {
  chartData: ChartData[]
}

export default function TopSpendersChart({ chartData }: TopSpendersChartProps) {
  if (chartData.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Top Setoran Anggota</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total Setoran" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

