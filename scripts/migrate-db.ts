/**
 * 데이터베이스 마이그레이션 스크립트
 * 
 * 실행 방법:
 *   npx tsx scripts/migrate-db.ts
 * 
 * 또는:
 *   npm run migrate
 */

// .env.local 파일 로드
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.local 파일 경로 지정
config({ path: resolve(__dirname, '../.env.local') });

import { getAdminFirestore } from '../src/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { normalizeCategory } from '../src/lib/utils/category';

const db = getAdminFirestore();

interface MigrationStats {
  campaigns: {
    total: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  users: {
    total: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

/**
 * 캠페인 문서에 누락된 필드 추가
 */
async function migrateCampaigns(): Promise<MigrationStats['campaigns']> {
  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    console.log('📦 캠페인 문서 마이그레이션 시작...');
    
    const campaignsSnapshot = await db.collection('campaigns').get();
    stats.total = campaignsSnapshot.size;
    
    console.log(`총 ${stats.total}개의 캠페인 문서 발견`);

    for (const doc of campaignsSnapshot.docs) {
      try {
        const data = doc.data();
        const updates: any = {};

        // 1. category 필드 추가 (specJson에서 추출)
        if (!data.category && data.currentSpecVersionId) {
          try {
            // specs 서브컬렉션에서 현재 버전의 specJson 가져오기
            const specDoc = await doc.ref.collection('specs').doc(data.currentSpecVersionId).get();
            if (specDoc.exists) {
              const specData = specDoc.data();
              const specJson = specData?.specJson;
              const rawCategory = specJson?.target_audience?.interests?.[0];
              
              if (rawCategory) {
                updates.category = normalizeCategory(rawCategory);
                console.log(`  [${doc.id}] category 추가: ${updates.category}`);
              } else {
                console.log(`  [${doc.id}] category 추출 실패: specJson.target_audience.interests[0] 없음`);
              }
            } else {
              console.log(`  [${doc.id}] category 추출 실패: spec 문서 없음 (specVersionId: ${data.currentSpecVersionId})`);
            }
          } catch (error) {
            console.warn(`  [${doc.id}] category 추출 중 오류:`, error);
          }
        }

        // 2. applicationsCount 필드 추가 (applications 서브컬렉션에서 계산)
        if (data.applicationsCount === undefined) {
          try {
            const applicationsSnapshot = await doc.ref.collection('applications').get();
            updates.applicationsCount = applicationsSnapshot.size;
            console.log(`  [${doc.id}] applicationsCount 추가: ${updates.applicationsCount}`);
          } catch (error) {
            console.warn(`  [${doc.id}] applicationsCount 계산 실패:`, error);
            updates.applicationsCount = 0;
          }
        }

        // 업데이트할 필드가 있으면 실행
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = Timestamp.now();
          await doc.ref.update(updates);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  [${doc.id}] 마이그레이션 실패:`, error);
        stats.errors++;
      }
    }

    console.log(`✅ 캠페인 마이그레이션 완료: ${stats.updated}개 업데이트, ${stats.skipped}개 스킵, ${stats.errors}개 오류`);
    return stats;
  } catch (error) {
    console.error('❌ 캠페인 마이그레이션 중 오류:', error);
    throw error;
  }
}

/**
 * 사용자 문서에 누락된 필드 추가
 */
async function migrateUsers(): Promise<MigrationStats['users']> {
  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    console.log('👥 사용자 문서 마이그레이션 시작...');
    
    const usersSnapshot = await db.collection('users').get();
    stats.total = usersSnapshot.size;
    
    console.log(`총 ${stats.total}개의 사용자 문서 발견`);

    for (const doc of usersSnapshot.docs) {
      try {
        const data = doc.data();
        const updates: any = {};

        // 1. profile.platforms 필드 추가 (기본값: 빈 배열)
        if (!data.profile) {
          updates.profile = {};
        }
        
        const profile = data.profile || {};
        if (!profile.platforms || !Array.isArray(profile.platforms)) {
          if (!updates.profile) {
            updates.profile = { ...profile };
          }
          updates.profile.platforms = [];
          console.log(`  [${doc.id}] profile.platforms 추가: []`);
        }

        // 2. 광고주 사용자에 profile.companyName 필드 확인
        if (data.role === 'advertiser' && !profile.companyName && data.companyName) {
          if (!updates.profile) {
            updates.profile = { ...profile };
          }
          updates.profile.companyName = data.companyName;
          console.log(`  [${doc.id}] profile.companyName 추가: ${data.companyName}`);
        }

        // 업데이트할 필드가 있으면 실행
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = Timestamp.now();
          await doc.ref.update(updates);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  [${doc.id}] 마이그레이션 실패:`, error);
        stats.errors++;
      }
    }

    console.log(`✅ 사용자 마이그레이션 완료: ${stats.updated}개 업데이트, ${stats.skipped}개 스킵, ${stats.errors}개 오류`);
    return stats;
  } catch (error) {
    console.error('❌ 사용자 마이그레이션 중 오류:', error);
    throw error;
  }
}

/**
 * 마이그레이션 실행
 */
async function runMigration() {
  console.log('🚀 데이터베이스 마이그레이션 시작\n');
  console.log('⚠️  주의: 이 스크립트는 프로덕션 데이터를 수정합니다.');
  console.log('⚠️  실행 전에 반드시 데이터 백업을 수행하세요.\n');

  const startTime = Date.now();
  const stats: MigrationStats = {
    campaigns: {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    },
    users: {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    },
  };

  try {
    // 캠페인 마이그레이션
    stats.campaigns = await migrateCampaigns();
    console.log('');

    // 사용자 마이그레이션
    stats.users = await migrateUsers();
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('📊 마이그레이션 요약:');
    console.log(`  캠페인: ${stats.campaigns.updated}/${stats.campaigns.total} 업데이트`);
    console.log(`  사용자: ${stats.users.updated}/${stats.users.total} 업데이트`);
    console.log(`  총 소요 시간: ${duration}초`);
    console.log('\n✅ 마이그레이션 완료!');
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigration, migrateCampaigns, migrateUsers };

