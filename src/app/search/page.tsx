'use client';

import { useEffect, useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/shared';
import { CampaignList } from '@/components/shared';
import { getFirebaseAuth } from '@/lib/firebase/auth';

// ============================================
// Search Content Component
// ============================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<{
    campaigns: any[];
    advertisers: any[];
    influencers: any[];
  }>({
    campaigns: [],
    advertisers: [],
    influencers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'campaigns' | 'advertisers' | 'influencers'>('all');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
    if (q) {
      performSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ campaigns: [], advertisers: [], influencers: [] });
      return;
    }

    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, { headers });
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const totalResults = results.campaigns.length + results.advertisers.length + results.influencers.length;

  const displayCampaigns = activeTab === 'all' || activeTab === 'campaigns' ? results.campaigns : [];
  const displayAdvertisers = activeTab === 'all' || activeTab === 'advertisers' ? results.advertisers : [];
  const displayInfluencers = activeTab === 'all' || activeTab === 'influencers' ? results.influencers : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* 검색 헤더 */}
      <section className="bg-gradient-to-b from-purple-50 to-white pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 */}
          <Link
            href="/main"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors"
          >
            <span>←</span>
            <span>메인으로</span>
          </Link>

          {/* 검색바 */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="캠페인, 광고주, 인플루언서를 검색하세요"
              className="
                w-full px-6 py-4 pr-14
                bg-white rounded-2xl
                border-2 border-purple-100
                text-lg text-gray-800
                placeholder:text-gray-400
                shadow-lg
                focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100
                transition-all duration-200
              "
            />
            <button
              type="submit"
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                w-10 h-10 rounded-xl
                bg-purple-600 text-white
                flex items-center justify-center
                hover:bg-purple-700 transition-colors
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* 탭 메뉴 */}
      {query && (
        <section className="bg-white border-b border-gray-100 py-4 px-4 sticky top-16 z-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`}
              >
                전체 ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'campaigns'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`}
              >
                캠페인 ({results.campaigns.length})
              </button>
              <button
                onClick={() => setActiveTab('advertisers')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'advertisers'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`}
              >
                광고주 ({results.advertisers.length})
              </button>
              <button
                onClick={() => setActiveTab('influencers')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'influencers'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                }`}
              >
                인플루언서 ({results.influencers.length})
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 검색 결과 */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 결과 헤더 */}
          <div className="mb-6">
            {query ? (
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  "<span className="text-purple-600">{query}</span>" 검색 결과
                </h1>
                <p className="text-gray-500 mt-1">
                  {totalResults}개의 결과를 찾았습니다
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold text-gray-900">통합 검색</h1>
                <p className="text-gray-500 mt-1">
                  검색어를 입력하세요
                </p>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">검색 중...</p>
            </div>
          ) : query ? (
            <div className="space-y-8">
              {/* 캠페인 결과 */}
              {displayCampaigns.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">캠페인</h2>
                  <CampaignList
                    campaigns={displayCampaigns.map(c => ({
                      id: c.id,
                      title: c.title,
                      description: c.description,
                      status: c.status,
                      deadline: c.deadline,
                      createdAt: c.createdAt,
                      advertiserName: c.advertiserName,
                      category: c.category,
                    }))}
                    variant="grid"
                    columns={3}
                    showStatus={true}
                    showAdvertiser={true}
                    emptyMessage="캠페인 검색 결과가 없습니다"
                  />
                </div>
              )}

              {/* 광고주 결과 */}
              {displayAdvertisers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">광고주</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayAdvertisers.map((advertiser) => (
                      <Link
                        key={advertiser.id}
                        href={`/advertiser/${advertiser.id}`}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {advertiser.displayName || advertiser.companyName || '광고주'}
                        </h3>
                        {advertiser.companyName && (
                          <p className="text-sm text-gray-600 mb-2">{advertiser.companyName}</p>
                        )}
                        {advertiser.bio && (
                          <p className="text-sm text-gray-500 line-clamp-2">{advertiser.bio}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 인플루언서 결과 */}
              {displayInfluencers.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">인플루언서</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayInfluencers.map((influencer) => (
                      <Link
                        key={influencer.id}
                        href={`/influencer/${influencer.id}`}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all"
                      >
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {influencer.nickname || influencer.displayName || '인플루언서'}
                        </h3>
                        {influencer.platforms && influencer.platforms.length > 0 && (
                          <div className="flex gap-2 mb-2">
                            {influencer.platforms.map((platform: string) => (
                              <span
                                key={platform}
                                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        )}
                        {influencer.bio && (
                          <p className="text-sm text-gray-500 line-clamp-2">{influencer.bio}</p>
                        )}
                        {influencer.followerCount > 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            팔로워 {influencer.followerCount.toLocaleString()}명
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 결과 없음 */}
              {totalResults === 0 && (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">🔍</span>
                  <p className="text-gray-500">"{query}"에 대한 검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🔍</span>
              <p className="text-gray-500">검색어를 입력하세요</p>
            </div>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 I:EUM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// Page Component with Suspense
// ============================================

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
