'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [timeframe, setTimeframe] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Year');

    useEffect(() => {
        // In dev, fetch from localhost
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000"}/api/analytics/dashboard`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));
    }, []);

    if (!stats) return <div className="p-8 text-center text-xl">Loading Dashboard...</div>;

    const lineData = {
        labels: stats.visitorTrends[timeframe].labels,
        datasets: stats.visitorTrends[timeframe].datasets.map((dataset: any, idx: number) => ({
            ...dataset,
            fill: true,
            borderColor: idx === 0 ? '#4f46e5' : '#a855f7',
            backgroundColor: idx === 0 ? 'rgba(79, 70, 229, 0.2)' : 'rgba(168, 85, 247, 0.2)',
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 5,
            borderWidth: 3,
        }))
    };

    const doughnutData = {
        labels: stats.highSaleProducts.map((p: any) => p.name),
        datasets: [
            {
                data: stats.highSaleProducts.map((p: any) => p.amount),
                backgroundColor: stats.highSaleProducts.map((p: any) => p.color),
                borderWidth: 0,
                cutout: '80%',
            }
        ]
    };

    const barData = {
        labels: stats.employmentGeneration?.labels?.length ? stats.employmentGeneration.labels : ['2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: (stats.employmentGeneration?.datasets?.length ? stats.employmentGeneration.datasets : [{
            label: 'Artisans Employed',
            data: [120, 250, 400, 650, 950, stats.artisansCount || 1200]
        }]).map((ds: any) => ({
            ...ds,
            backgroundColor: 'rgba(79, 70, 229, 0.8)', // #4f46e5 with opacity
            borderColor: '#a855f7', // #a855f7
            borderWidth: 2,
            hoverBackgroundColor: '#a855f7',
            borderRadius: 4,
        }))
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-primary-dark)]">Dashboard Overview</h1>
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-2 bg-gray-100 rounded-full font-semibold">Welcome, {user.name} ({user.role})</span>
                        <button 
                            onClick={logout} 
                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-[#808000]">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Heritage Sites</h3>
                    <p className="text-3xl font-bold mt-2">{stats.sitesCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-[#556B2F]">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Artisans Count</h3>
                    <p className="text-3xl font-bold mt-2">{stats.artisansCount}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-[#FFD700]">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">States Covered</h3>
                    <p className="text-3xl font-bold mt-2">{stats.statesCovered}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-[#ca8a04]">
                    <h3 className="text-gray-500 text-sm font-bold uppercase">Annual Visitors</h3>
                    <p className="text-3xl font-bold mt-2">{stats.annualVisitors.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[var(--color-primary-dark)]">New visitors</h2>
                        <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-100">
                            {(['Day', 'Week', 'Month', 'Year'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                        timeframe === t 
                                        ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <Line 
                            data={lineData as any} 
                            options={{ 
                                responsive: true, 
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 25,
                                            font: { size: 12, weight: 'bold' as const },
                                            color: '#64748b'
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: '#1e293b',
                                        padding: 12,
                                        cornerRadius: 10,
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: '#f1f5f9' },
                                        ticks: { color: '#94a3b8' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8' }
                                    }
                                },
                                interaction: {
                                    intersect: false,
                                    mode: 'index',
                                },
                            }} 
                        />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[var(--color-primary-dark)]">High Sale Products</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium cursor-pointer hover:text-gray-700 transition-colors">
                            Last Year 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <Doughnut 
                                data={doughnutData as any} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } }
                                }} 
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-extrabold text-[#1e293b]">
                                    ₹{stats.totalSales.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-3">
                            {stats.highSaleProducts.map((product: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-2.5 h-2.5 rounded-full" 
                                            style={{ border: `2px solid ${product.color}` }}
                                        ></div>
                                        <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{product.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-[#22c55e]">₹{product.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow md:col-span-1">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Economic Impact Analysis</h2>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Tourism Revenue</span>
                        <span className="font-bold">₹{stats.economicImpact.tourismRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Artisan Revenue</span>
                        <span className="font-bold">₹{stats.economicImpact.artisanRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t border-gray-100 text-lg">
                        <span className="font-bold">Total Impact</span>
                        <span className="font-bold text-[#556B2F]">₹{stats.economicImpact.totalEconomicImpact.toLocaleString()}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow md:col-span-1">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Recommended Heritage Sites</h2>
                    <ul className="space-y-3">
                        {stats.recommendedSites && stats.recommendedSites.length > 0 ? (
                            stats.recommendedSites.map((site: any) => (
                                <li key={site.id} className="flex justify-between items-center group p-2 rounded transition border border-transparent hover:border-gray-100 hover:bg-gray-50">
                                    <span className="font-semibold text-[var(--color-primary-dark)]">{site.name}</span>
                                    <Link 
                                        href={`/heritage/${site.id}`}
                                        className="text-xs bg-[var(--color-accent)] px-3 py-1.5 rounded-lg text-black font-bold hover:bg-yellow-500 transition-colors shadow-sm"
                                    >
                                        View
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500 text-sm italic">No recommendations available</li>
                        )}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow md:col-span-1 flex flex-col">
                    <h2 className="text-xl font-bold text-[var(--color-primary-dark)]">Employment Generation</h2>
                    <p className="text-sm text-gray-500 mb-4">Kitne artisans ko rojgar mila</p>
                    <div className="flex-1 relative min-h-[200px]">
                        <Bar 
                            data={barData as any}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#1e293b',
                                        padding: 12,
                                        cornerRadius: 8,
                                    }
                                },
                                scales: {
                                    y: { 
                                        beginAtZero: true, 
                                        grid: { color: '#f1f5f9' },
                                        ticks: { color: '#94a3b8' }
                                    },
                                    x: { 
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8' }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
