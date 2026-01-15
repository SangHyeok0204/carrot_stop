'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Campaign } from '@/contexts';
import { CampaignCard } from '@/components/shared/CampaignCard';
import { Button } from '@/components/ui/button';

// ============================================
// Campaign Section Component
// 진행 중인 캠페인 / 완료된 캠페인 섹션
// ============================================

interface CampaignSectionProps {
  title: string;
  campaigns: Campaign[];
  emptyMessage: string;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

export function CampaignSection({ 
  title, 
  campaigns, 
  emptyMessage,
  showDeleteButton = false,
  onDelete,
  applicationIds,
  onCancelApplication,
}: CampaignSectionProps) {
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (campaignId: string, campaignTitle: string) => {
    if (!confirm(`정말 "${campaignTitle}" 캠페인을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 영구적으로 삭제됩니다.`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(campaignId));
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        if (onDelete) {
          onDelete();
        } else {
          router.refresh();
        }
      } else {
        alert(data.error?.message || '캠페인 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      alert('캠페인 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    }
  };

  const handleCancelApplication = async (campaignId: string, applicationId: string) => {
    setCancellingIds(prev => new Set(prev).add(campaignId));
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/campaigns/${campaignId}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        if (onCancelApplication) {
          onCancelApplication(campaignId, applicationId);
        } else {
          router.refresh();
        }
      } else {
        alert(data.error?.message || '지원 취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cancel application error:', error);
      alert('지원 취소 중 오류가 발생했습니다.');
    } finally {
      setCancellingIds(prev => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    }
  };

  return (
    <section>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {campaigns.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const applicationId = applicationIds?.[campaign.id];
            const canCancel = applicationId && campaign.status === 'OPEN';
            
            return (
              <div key={campaign.id} className="relative">
                <CampaignCard
                  campaign={campaign}
                  showStatus={true}
                />
                {/* 광고주: 캠페인 삭제 버튼 */}
                {showDeleteButton && campaign.status !== 'RUNNING' && campaign.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleDelete(campaign.id, campaign.title)}
                    disabled={deletingIds.has(campaign.id)}
                    className="
                      absolute top-2 right-2
                      w-8 h-8 rounded-full
                      bg-red-600 text-white
                      hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed
                      flex items-center justify-center
                      transition-colors shadow-lg
                    "
                    title="캠페인 삭제"
                  >
                    {deletingIds.has(campaign.id) ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
                {/* 인플루언서: 지원 취소 버튼 */}
                {canCancel && (
                  <button
                    onClick={() => {
                      if (confirm('정말 지원을 취소하시겠습니까?')) {
                        handleCancelApplication(campaign.id, applicationId);
                      }
                    }}
                    disabled={cancellingIds.has(campaign.id)}
                    className="
                      absolute top-2 right-2
                      w-8 h-8 rounded-full
                      bg-orange-600 text-white
                      hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed
                      flex items-center justify-center
                      transition-colors shadow-lg
                    "
                    title="지원 취소"
                  >
                    {cancellingIds.has(campaign.id) ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
