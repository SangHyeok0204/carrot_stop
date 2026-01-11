// 더미 캠페인 생성 스크립트
const fetch = require('node-fetch');

async function generateDummyCampaigns() {
  try {
    const response = await fetch('http://localhost:3000/api/campaigns/generate-dummy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ 성공:', data.message);
      console.log('생성된 캠페인:', data.data.campaigns.length, '개');
      data.data.campaigns.forEach((campaign, index) => {
        console.log(`  ${index + 1}. ${campaign.title}`);
      });
    } else {
      console.error('❌ 실패:', data.error?.message || '알 수 없는 오류');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 개발 서버가 실행 중인지 확인하세요: npm run dev');
  }
}

generateDummyCampaigns();

