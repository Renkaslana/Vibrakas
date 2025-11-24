'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface DailyData {
  date: string
  income: number
  expense: number
}

interface DashboardChartsProps {
  dailyData: DailyData[]
}

export default function DashboardCharts({ dailyData }: DashboardChartsProps) {
  // Format date for display
  const formattedData = dailyData.map(item => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pemasukan 30 Hari Terakhir</CardTitle>
          <CardDescription>Grafik pemasukan harian</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={2}
                name="Pemasukan"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran 30 Hari Terakhir</CardTitle>
          <CardDescription>Grafik pengeluaran harian</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" />
              <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

