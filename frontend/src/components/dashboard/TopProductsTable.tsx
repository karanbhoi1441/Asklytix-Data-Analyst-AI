import React, { useState } from 'react';
import type { ProductItem } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface TopProductsTableProps {
  products: ProductItem[];
  title?: string;
}

export const TopProductsTable: React.FC<TopProductsTableProps> = ({ products, title = 'Top Performing Products' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ProductItem>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: keyof ProductItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <Card variant="glass" className="w-full border-cyan-500/30 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Table Header & Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
        <span className="font-bold text-white text-base flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-cyan-400" /> {title}
        </span>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            className="bg-slate-950/80 text-xs py-1.5"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/60 border-b border-slate-800 uppercase text-[10px] font-mono text-slate-400">
            <tr>
              <th className="py-2.5 px-3"># Rank</th>
              <th 
                className="py-2.5 px-3 cursor-pointer hover:text-cyan-300 transition-colors"
                onClick={() => handleSort('name')}
              >
                Product Name <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
              </th>
              <th className="py-2.5 px-3">Category</th>
              <th 
                className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-300 transition-colors"
                onClick={() => handleSort('revenue')}
              >
                Revenue <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
              </th>
              <th 
                className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-300 transition-colors"
                onClick={() => handleSort('orders')}
              >
                Orders <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
              </th>
              <th 
                className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-300 transition-colors"
                onClick={() => handleSort('growth')}
              >
                Growth <ArrowUpDown className="w-3 h-3 inline ml-0.5" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/60 transition-colors font-sans">
                <td className="py-3 px-3 font-mono font-bold text-cyan-400">#{p.rank}</td>
                <td className="py-3 px-3 font-bold text-white max-w-[200px] truncate">{p.name}</td>
                <td className="py-3 px-3 font-mono text-slate-400">
                  <Badge variant="secondary" size="sm">{p.category}</Badge>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-cyan-300">
                  ${p.revenue.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono">{p.orders.toLocaleString()}</td>
                <td className="py-3 px-3 text-right font-mono">
                  <span className={p.growth >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {p.growth >= 0 ? '+' : ''}{p.growth}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-mono">
        <span>Showing {paginated.length} of {sorted.length} products</span>
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button
            variant="icon"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
