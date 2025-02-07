'use client';

import { Tab } from '@headlessui/react';
import { StatusBadge } from '../../ui/status/StatusBadge';
import { ActiveProductsTab } from '../product/tabs/ActiveProductsTab';
import { InactiveProductsTab } from '../product/tabs/InactiveProductsTab';
import { Product } from './types'

interface ProductTabsProps {
  activeTab: 'active' | 'inactive';
  onTabChange: (tab: 'active' | 'inactive') => void;
  activeCount: number;
  inactiveCount: number;
  activeProducts: Product[];
  inactiveProducts: Product[];
  onEdit?: (product: Product | undefined) => void;
  onDelete?: (product: Product) => void;
  selectedProducts?: string[];
  onSelectProduct?: (productId: string) => void;
  onSelectAll?: () => void;
  onStatusChange: (productId: string, newStatus: 'active' | 'inactive') => Promise<void>;
  loading?: boolean;
}

export function ProductTabs({
  activeTab,
  onTabChange,
  activeCount,
  inactiveCount,
  activeProducts,
  inactiveProducts,
  onEdit,
  onDelete,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onStatusChange,
  loading
}: ProductTabsProps) {
  return (
    <Tab.Group selectedIndex={activeTab === 'active' ? 0 : 1} onChange={(index) => onTabChange(index === 0 ? 'active' : 'inactive')}>
      <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
        <Tab className={({ selected }) => `
          w-full rounded-lg py-2.5 text-sm font-medium leading-5
          ${selected ? 'bg-white shadow' : 'hover:bg-white/[0.12]'}
        `}>
          <div className="flex items-center justify-center space-x-2">
            <span>Active Products</span>
            <StatusBadge 
              status="active" 
              type="product" 
              showIcon={false} 
              className="ml-2"
            >
              {loading ? '...' : activeCount}
            </StatusBadge>
          </div>
        </Tab>
        <Tab className={({ selected }) => `
          w-full rounded-lg py-2.5 text-sm font-medium leading-5
          ${selected ? 'bg-white shadow' : 'hover:bg-white/[0.12]'}
        `}>
          <div className="flex items-center justify-center space-x-2">
            <span>Inactive Products</span>
            <StatusBadge status="inactive" type="product" showIcon={false} className="ml-2">
              {loading ? '...' : inactiveCount}
            </StatusBadge>
          </div>
        </Tab>
      </Tab.List>
      
      <Tab.Panels className="mt-4">
        <Tab.Panel>
          <ActiveProductsTab
            products={activeProducts}
            onEdit={onEdit}
            onDelete={onDelete}
            selectedProducts={selectedProducts}
            onSelectProduct={onSelectProduct}
            onSelectAll={onSelectAll}
            onStatusChange={onStatusChange}
            loading={loading}
          />
        </Tab.Panel>
        <Tab.Panel>
          <InactiveProductsTab
            products={inactiveProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={onSelectProduct}
            onSelectAll={onSelectAll}
            onStatusChange={onStatusChange}
            loading={loading}
          />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
} 