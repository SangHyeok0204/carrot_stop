/**
 * 데이터 검증 스크립트
 * 
 * 실행 방법:
 *   npx tsx scripts/validate-data.ts
 * 
 * 또는:
 *   npm run validate
 */

import { getAdminFirestore } from '../src/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminFirestore();

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * 캠페인 데이터 검증
 */
async function validateCampaigns(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      total: 0,
      valid: 0,
      invalid: 0,
    },
  };

  try {
    console.log('📦 캠페인 데이터 검증 시작...');
    
    const campaignsSnapshot = await db.collection('campaigns').get();
    result.stats.total = campaignsSnapshot.size;
    
    console.log(`총 ${result.stats.total}개의 캠페인 문서 검증`);

    for (const doc of campaignsSnapshot.docs) {
      const data = doc.data();
      const campaignId = doc.id;
      let isValid = true;

      // 필수 필드 검증
      if (!data.title) {
        result.errors.push(`[${campaignId}] title 필드 누락`);
        isValid = false;
      }

      if (!data.advertiserId) {
        result.errors.push(`[${campaignId}] advertiserId 필드 누락`);
        isValid = false;
      }

      if (!data.status) {
        result.errors.push(`[${campaignId}] status 필드 누락`);
        isValid = false;
      }

      // 권장 필드 검증 (경고)
      if (!data.category) {
        result.warnings.push(`[${campaignId}] category 필드 없음 (권장)`);
      }

      if (data.applicationsCount === undefined) {
        result.warnings.push(`[${campaignId}] applicationsCount 필드 없음 (권장)`);
      }

      // 데이터 일관성 검증
      if (data.status === 'OPEN' && !data.openedAt) {
        result.warnings.push(`[${campaignId}] OPEN 상태인데 openedAt 필드 없음`);
      }

      if (data.status === 'COMPLETED' && !data.completedAt) {
        result.warnings.push(`[${campaignId}] COMPLETED 상태인데 completedAt 필드 없음`);
      }

      // applicationsCount와 실제 applications 수 비교
      if (data.applicationsCount !== undefined) {
        try {
          const applicationsSnapshot = await doc.ref.collection('applications').get();
          const actualCount = applicationsSnapshot.size;
          
          if (data.applicationsCount !== actualCount) {
            result.warnings.push(
              `[${campaignId}] applicationsCount 불일치: 저장된 값(${data.applicationsCount}) vs 실제(${actualCount})`
            );
          }
        } catch (error) {
          result.warnings.push(`[${campaignId}] applications 서브컬렉션 조회 실패`);
        }
      }

      if (isValid) {
        result.stats.valid++;
      } else {
        result.stats.invalid++;
        result.isValid = false;
      }
    }

    console.log(`✅ 캠페인 검증 완료: ${result.stats.valid}/${result.stats.total} 유효`);
    return result;
  } catch (error) {
    console.error('❌ 캠페인 검증 중 오류:', error);
    result.isValid = false;
    result.errors.push(`검증 중 오류 발생: ${error}`);
    return result;
  }
}

/**
 * 사용자 데이터 검증
 */
async function validateUsers(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      total: 0,
      valid: 0,
      invalid: 0,
    },
  };

  try {
    console.log('👥 사용자 데이터 검증 시작...');
    
    const usersSnapshot = await db.collection('users').get();
    result.stats.total = usersSnapshot.size;
    
    console.log(`총 ${result.stats.total}개의 사용자 문서 검증`);

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userId = doc.id;
      let isValid = true;

      // 필수 필드 검증
      if (!data.role) {
        result.errors.push(`[${userId}] role 필드 누락`);
        isValid = false;
      }

      if (!data.email) {
        result.errors.push(`[${userId}] email 필드 누락`);
        isValid = false;
      }

      // 역할별 필수 필드 검증
      if (data.role === 'advertiser') {
        if (!data.profile?.companyName && !data.companyName) {
          result.warnings.push(`[${userId}] 광고주인데 companyName 필드 없음 (권장)`);
        }
      }

      if (data.role === 'influencer') {
        if (!data.profile?.platforms || !Array.isArray(data.profile.platforms)) {
          result.warnings.push(`[${userId}] 인플루언서인데 profile.platforms 필드 없음 (권장)`);
        }
      }

      // 데이터 일관성 검증
      if (data.profile && typeof data.profile !== 'object') {
        result.errors.push(`[${userId}] profile 필드가 객체가 아님`);
        isValid = false;
      }

      if (isValid) {
        result.stats.valid++;
      } else {
        result.stats.invalid++;
        result.isValid = false;
      }
    }

    console.log(`✅ 사용자 검증 완료: ${result.stats.valid}/${result.stats.total} 유효`);
    return result;
  } catch (error) {
    console.error('❌ 사용자 검증 중 오류:', error);
    result.isValid = false;
    result.errors.push(`검증 중 오류 발생: ${error}`);
    return result;
  }
}

/**
 * 고아 데이터 검증 (참조는 있지만 실제 데이터가 없는 경우)
 */
async function validateOrphanedData(): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      total: 0,
      valid: 0,
      invalid: 0,
    },
  };

  try {
    console.log('🔍 고아 데이터 검증 시작...');
    
    // 캠페인의 advertiserId가 실제 사용자를 가리키는지 확인
    const campaignsSnapshot = await db.collection('campaigns').get();
    result.stats.total = campaignsSnapshot.size;

    for (const doc of campaignsSnapshot.docs) {
      const data = doc.data();
      const campaignId = doc.id;

      if (data.advertiserId) {
        const advertiserDoc = await db.collection('users').doc(data.advertiserId).get();
        if (!advertiserDoc.exists) {
          result.warnings.push(`[${campaignId}] advertiserId(${data.advertiserId})가 존재하지 않는 사용자를 가리킴`);
        }
      }

      // applications의 influencerId 확인
      try {
        const applicationsSnapshot = await doc.ref.collection('applications').get();
        for (const appDoc of applicationsSnapshot.docs) {
          const appData = appDoc.data();
          if (appData.influencerId) {
            const influencerDoc = await db.collection('users').doc(appData.influencerId).get();
            if (!influencerDoc.exists) {
              result.warnings.push(
                `[${campaignId}] application(${appDoc.id})의 influencerId(${appData.influencerId})가 존재하지 않는 사용자를 가리킴`
              );
            }
          }
        }
      } catch (error) {
        // applications 서브컬렉션이 없을 수 있음
      }

      result.stats.valid++;
    }

    console.log(`✅ 고아 데이터 검증 완료`);
    return result;
  } catch (error) {
    console.error('❌ 고아 데이터 검증 중 오류:', error);
    result.isValid = false;
    result.errors.push(`검증 중 오류 발생: ${error}`);
    return result;
  }
}

/**
 * 전체 검증 실행
 */
async function runValidation() {
  console.log('🔍 데이터 검증 시작\n');

  const results = {
    campaigns: await validateCampaigns(),
    users: await validateUsers(),
    orphaned: await validateOrphanedData(),
  };

  console.log('\n📊 검증 결과 요약:');
  console.log('\n캠페인:');
  console.log(`  ✅ 유효: ${results.campaigns.stats.valid}/${results.campaigns.stats.total}`);
  console.log(`  ❌ 무효: ${results.campaigns.stats.invalid}`);
  console.log(`  ⚠️  경고: ${results.campaigns.warnings.length}개`);
  console.log(`  ❌ 오류: ${results.campaigns.errors.length}개`);

  console.log('\n사용자:');
  console.log(`  ✅ 유효: ${results.users.stats.valid}/${results.users.stats.total}`);
  console.log(`  ❌ 무효: ${results.users.stats.invalid}`);
  console.log(`  ⚠️  경고: ${results.users.warnings.length}개`);
  console.log(`  ❌ 오류: ${results.users.errors.length}개`);

  console.log('\n고아 데이터:');
  console.log(`  ⚠️  경고: ${results.orphaned.warnings.length}개`);
  console.log(`  ❌ 오류: ${results.orphaned.errors.length}개`);

  // 경고 및 오류 상세 출력
  if (results.campaigns.warnings.length > 0 || results.campaigns.errors.length > 0) {
    console.log('\n📋 캠페인 상세:');
    results.campaigns.errors.forEach(err => console.log(`  ❌ ${err}`));
    results.campaigns.warnings.slice(0, 10).forEach(warn => console.log(`  ⚠️  ${warn}`));
    if (results.campaigns.warnings.length > 10) {
      console.log(`  ... 외 ${results.campaigns.warnings.length - 10}개 경고`);
    }
  }

  if (results.users.warnings.length > 0 || results.users.errors.length > 0) {
    console.log('\n📋 사용자 상세:');
    results.users.errors.forEach(err => console.log(`  ❌ ${err}`));
    results.users.warnings.slice(0, 10).forEach(warn => console.log(`  ⚠️  ${warn}`));
    if (results.users.warnings.length > 10) {
      console.log(`  ... 외 ${results.users.warnings.length - 10}개 경고`);
    }
  }

  if (results.orphaned.warnings.length > 0) {
    console.log('\n📋 고아 데이터 상세:');
    results.orphaned.warnings.slice(0, 10).forEach(warn => console.log(`  ⚠️  ${warn}`));
    if (results.orphaned.warnings.length > 10) {
      console.log(`  ... 외 ${results.orphaned.warnings.length - 10}개 경고`);
    }
  }

  const allValid = results.campaigns.isValid && results.users.isValid && results.orphaned.isValid;
  
  if (allValid) {
    console.log('\n✅ 모든 검증 통과!');
  } else {
    console.log('\n⚠️  일부 검증 실패. 위의 오류를 확인하세요.');
  }

  return allValid;
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runValidation()
    .then((isValid) => {
      process.exit(isValid ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runValidation, validateCampaigns, validateUsers, validateOrphanedData };

