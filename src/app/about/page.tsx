'use client';

import { TopNav } from '@/components/shared';

export default function AboutUsPage() {
  const features = [
    {
      title: '캠페인 별 KPI 맞춤형 매체 운영 전략 및 솔루션 제공',
      description: '각 캠페인의 목표에 맞는 맞춤형 전략을 제공합니다.',
      icon: '🎯',
    },
    {
      title: 'GA, 에이스카운터 등 여러 트래킹 툴 기반의 Data Driven',
      description: '다양한 분석 도구를 활용한 데이터 기반 의사결정을 지원합니다.',
      icon: '📊',
    },
    {
      title: 'DMP 플랫폼을 활용한 정교한 타겟팅',
      description: '고도화된 데이터 관리 플랫폼으로 정확한 타겟팅을 실현합니다.',
      icon: '🎯',
    },
    {
      title: 'Data 기반의 광고 소재 기획 및 제작',
      description: '데이터 분석 결과를 바탕으로 효과적인 광고 소재를 기획합니다.',
      icon: '🎨',
    },
    {
      title: 'ROAS 기반의 퍼포먼스 극대화',
      description: '투자 대비 수익률을 최적화하여 성과를 극대화합니다.',
      icon: '📈',
    },
    {
      title: '다양한 트래킹 툴 Data 바탕으로 랜딩 페이지 최적화 제안',
      description: '트래킹 데이터를 분석하여 랜딩 페이지를 지속적으로 개선합니다.',
      icon: '🔧',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-purple-50 to-white">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-6 text-center">
              About I:EUM
            </h1>
            <p className="text-xl text-gray-700 text-center max-w-3xl mx-auto leading-relaxed">
              I:EUM은 신개념 광고 기술을 활용한 심도 있는 그로스 마케팅에 기반한 매체 운영 플랫폼입니다.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-purple-900 mb-6">우리의 미션</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  브랜드와 인플루언서를 연결하여 효과적인 마케팅 캠페인을 만들어냅니다.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  AI 기반 캠페인 생성부터 성과 분석까지, 모든 과정을 자동화하여 효율적인 광고 운영을 지원합니다.
                  데이터 기반 의사결정과 정교한 타겟팅을 통해 최적의 성과를 달성할 수 있도록 돕습니다.
                </p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-purple-900 mb-4">핵심 가치</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>데이터 기반 의사결정</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>맞춤형 전략 제공</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>성과 극대화</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    <span>지속적인 최적화</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-purple-900 mb-12 text-center">
              우리의 서비스
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-purple-900 mb-12 text-center">
              왜 I:EUM인가요?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">데이터 기반</h3>
                <p className="text-gray-600">
                  다양한 트래킹 툴과 분석 도구를 활용하여 객관적이고 정확한 데이터로 의사결정을 지원합니다.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">맞춤형 전략</h3>
                <p className="text-gray-600">
                  각 캠페인의 목표와 특성에 맞는 맞춤형 매체 운영 전략을 제공하여 최적의 성과를 달성합니다.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">성과 극대화</h3>
                <p className="text-gray-600">
                  ROAS 기반의 퍼포먼스 최적화와 지속적인 개선을 통해 투자 대비 수익률을 극대화합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-violet-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              함께 성장해요
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              I:EUM과 함께 더 나은 마케팅 성과를 만들어가세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                지금 시작하기
              </a>
              <a
                href="/contact"
                className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                문의하기
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

