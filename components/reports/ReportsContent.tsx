'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  createdAt: Date | string
  user?: {
    name: string
  }
}

interface ReportsContentProps {
  transactions: Transaction[]
  totalIncome: number
  totalExpense: number
  netAmount: number
  startDate: string
  endDate: string
  userRole: string
}

export default function ReportsContent({
  transactions,
  totalIncome,
  totalExpense,
  netAmount,
  startDate: initialStartDate,
  endDate: initialEndDate,
  userRole,
}: ReportsContentProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleFilter = () => {
    router.push(`/reports?startDate=${startDate}&endDate=${endDate}`)
  }

  // Group by date for chart
  const chartData = transactions
    .filter(tx => tx.status === "success")
    .reduce((acc: any, tx) => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 }
      }
      if (tx.type === "in") {
        acc[date].income += tx.amount
      } else {
        acc[date].expense += tx.amount
      }
      return acc
    }, {})

  const chartDataArray = Object.values(chartData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  )

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ['Tanggal', 'Tipe', 'Nominal', 'Status'].join(','),
      ...transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString('id-ID'),
        tx.type === "in" ? "Pemasukan" : "Pengeluaran",
        tx.amount,
        tx.status,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-${startDate}-${endDate}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full">
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Pemasukan & Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartDataArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" name="Pemasukan" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Pengeluaran" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Pemasukan & Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Pemasukan" />
                <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}

