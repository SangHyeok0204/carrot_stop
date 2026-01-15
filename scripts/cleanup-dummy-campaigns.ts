/**
 * 임의로 생성된 캠페인 삭제 스크립트
 * 
 * 실행 방법:
 *   npx tsx scripts/cleanup-dummy-campaigns.ts
 * 
 * 또는:
 *   npm run cleanup
 * 
 * 주의: 이 스크립트는 데이터를 삭제합니다. 실행 전에 백업을 권장합니다.
 */

// .env.local 파일 로드 (가장 먼저 실행)
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 경로 지정
config({ path: resolve(__dirname, '../.env.local') });

import { getAdminFirestore } from '../src/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminFirestore();

/**
 * 삭제할 캠페인 식별 조건
 */
function shouldDeleteCampaign(data: any, docId: string): boolean {
  // 1. dummy-advertiser-id로 생성된 캠페인
  if (data.advertiserId === 'dummy-advertiser-id') {
    return true;
  }

  // 2. 제목에 테스트 관련 키워드가 포함된 캠페인
  const title = (data.title || '').toLowerCase();
  const testKeywords = ['테스트', 'test', 'dummy', '더미', '샘플', 'sample', '임시'];
  if (testKeywords.some(keyword => title.includes(keyword))) {
    return true;
  }

  // 3. 설명에 테스트 관련 키워드가 포함된 캠페인
  const description = (data.naturalLanguageInput || '').toLowerCase();
  if (testKeywords.some(keyword => description.includes(keyword))) {
    return true;
  }

  return false;
}

/**
 * 캠페인 삭제 실행
 */
async function cleanupDummyCampaigns() {
  console.log('🧹 임의로 생성된 캠페인 정리 시작...\n');
  console.log('⚠️  주의: 이 스크립트는 데이터를 삭제합니다.\n');

  try {
    // 모든 캠페인 조회
    const campaignsSnapshot = await db.collection('campaigns').get();
    console.log(`총 ${campaignsSnapshot.size}개의 캠페인 문서 발견\n`);

    const campaignsToDelete: Array<{ id: string; title: string; advertiserId: string; reason: string }> = [];

    // 삭제할 캠페인 식별
    for (const doc of campaignsSnapshot.docs) {
      const data = doc.data();
      const docId = doc.id;

      if (shouldDeleteCampaign(data, docId)) {
        let reason = '';
        if (data.advertiserId === 'dummy-advertiser-id') {
          reason = 'dummy-advertiser-id';
        } else {
          reason = '테스트 키워드 포함';
        }

        campaignsToDelete.push({
          id: docId,
          title: data.title || '(제목 없음)',
          advertiserId: data.advertiserId || '(광고주 없음)',
          reason,
        });
      }
    }

    if (campaignsToDelete.length === 0) {
      console.log('✅ 삭제할 캠페인이 없습니다.');
      return;
    }

    // 삭제할 캠페인 목록 표시
    console.log(`🗑️  삭제할 캠페인 ${campaignsToDelete.length}개 발견:\n`);
    campaignsToDelete.forEach((campaign, index) => {
      console.log(`${index + 1}. [${campaign.id}] ${campaign.title}`);
      console.log(`   광고주: ${campaign.advertiserId}`);
      console.log(`   사유: ${campaign.reason}\n`);
    });

    // 확인 메시지
    console.log('⚠️  위 캠페인들을 삭제하시겠습니까?');
    console.log('⚠️  이 작업은 되돌릴 수 없습니다.\n');

    // 실제 삭제 실행
    let deletedCount = 0;
    let errorCount = 0;

    for (const campaign of campaignsToDelete) {
      try {
        const campaignRef = db.collection('campaigns').doc(campaign.id);
        const batch = db.batch();
        
        // 캠페인 문서 삭제
        batch.delete(campaignRef);
        
        // 서브컬렉션 삭제
        const collections = ['applications', 'submissions', 'specs', 'events'];
        for (const collectionName of collections) {
          const subCollectionRef = campaignRef.collection(collectionName);
          const subSnapshot = await subCollectionRef.get();
          subSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }
        
        await batch.commit();
        console.log(`✅ [${campaign.id}] ${campaign.title} 삭제 완료`);
        deletedCount++;
      } catch (error: any) {
        console.error(`❌ [${campaign.id}] 삭제 실패:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 정리 요약:');
    console.log(`  삭제 성공: ${deletedCount}개`);
    console.log(`  삭제 실패: ${errorCount}개`);
    console.log(`  총 삭제 대상: ${campaignsToDelete.length}개`);

    if (deletedCount > 0) {
      console.log('\n✅ 캠페인 정리 완료!');
    }
  } catch (error) {
    console.error('\n❌ 정리 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  cleanupDummyCampaigns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupDummyCampaigns };
