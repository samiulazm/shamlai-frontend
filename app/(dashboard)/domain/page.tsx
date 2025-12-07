'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { CustomDomain } from '@/lib/types/database';

export default function Domain() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [currentSubdomain, setCurrentSubdomain] = useState<string>('');
  const [currentShopId, setCurrentShopId] = useState<string>('');

  useEffect(() => {
    fetchDomains();
  }, []);

  // Fetch shop details and custom domains
  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop settings to get subdomain and shop_id
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id, subdomain')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) {
        throw new Error('Shop not found');
      }

      // Fetch custom domains using proper shop_id
      const { data: domainsData, error: domainsError } = await supabaseClient
        .from('custom_domains')
        .select('*')
        .eq('shop_id', shop.shop_id)
        .order('created_at', { ascending: false });

      if (domainsError) throw domainsError;
      setDomains(domainsData || []);

      // Store shop subclass/subdomain for display if needed
      // For now we just use it in the render logic via a separate state or just keeping the shop object if we fetched it.
      // Better to store the current shop subdomain in a state if we want to display it.
      setCurrentSubdomain(shop.subdomain);
      setCurrentShopId(shop.shop_id);

    } catch (err: any) {
      logger.error('Error fetching domains', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!newDomain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    if (!currentShopId) {
      setError('Shop ID not loaded');
      return;
    }

    try {
      setVerifying(true);
      setError(null);

      // Create domain record using currentShopId
      const { data, error: domainError } = await supabaseClient
        .from('custom_domains')
        .insert([
          {
            shop_id: currentShopId,
            domain: newDomain.trim(),
            is_verified: false,
            is_active: false,
          },
        ])
        .select()
        .single();

      if (domainError) throw domainError;

      // In a real implementation, you'd verify the domain via DNS records
      alert(`Domain ${newDomain} added! Please add DNS records to verify.`);
      setNewDomain('');
      await fetchDomains();
    } catch (err: any) {
      logger.error('Error adding domain', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to add domain');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domains...</p>
        </div>
      </div>
    );
  }

  // Get default domain from shop settings or use placeholder
  const primaryCustomDomain = domains.find((d) => d.is_primary)?.domain;
  const defaultDomain = primaryCustomDomain || (currentSubdomain ? `${currentSubdomain}.shamlai.co` : 'Checking...');

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Domain</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-pad grid gap-3">
          <div>
            <div className="label">Current Domain</div>
            <div className="mt-1 rounded-xl border p-3 text-sm bg-gray-50">{defaultDomain}</div>
          </div>
          <div>
            <div className="label">Custom Domain</div>
            <div className="flex gap-2 mt-1">
              <input
                className="input flex-1"
                placeholder="yourshop.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                disabled={verifying}
              />
              <button
                onClick={handleVerify}
                className="btn btn-outline"
                disabled={verifying || !newDomain.trim()}
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add a CNAME record pointing to your shop to verify ownership.
            </p>
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="card">
          <div className="card-pad">
            <div className="label mb-2">Your Domains</div>
            <div className="space-y-2">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">{domain.domain}</div>
                    <div className="text-xs text-gray-500">
                      {domain.is_verified ? 'Verified' : 'Pending verification'} •
                      {domain.is_primary ? ' Primary' : ' Secondary'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {domain.is_verified && !domain.is_primary && (
                      <button className="btn btn-sm btn-primary">Set as Primary</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
