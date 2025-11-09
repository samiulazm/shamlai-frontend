'use client';

import { useEffect, useState } from 'react';
import { Globe, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CampaignProducts() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch campaign products
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Campaign Products
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage products featured in marketing campaigns
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No campaigns configured</p>
          <button className="btn btn-primary">Create Your First Campaign</button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-medium">Active Campaigns</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-500 text-sm">Campaign management interface coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}
