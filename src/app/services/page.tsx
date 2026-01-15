'use client';

import { TopNav } from '@/components/shared';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <main className="pt-16">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-8">
              Services
            </h1>
            
            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  캠페인 별 KPI 맞춤형 매체 운영 전략 및 솔루션 제공
                </h2>
                <p className="text-purple-700">
                  각 캠페인의 목표에 맞는 맞춤형 전략을 제공합니다.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  GA, 에이스카운터 등 여러 트래킹 툴 기반의 Data Driven
                </h2>
                <p className="text-purple-700">
                  다양한 분석 도구를 활용한 데이터 기반 의사결정을 지원합니다.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  DMP 플랫폼을 활용한 정교한 타겟팅
                </h2>
                <p className="text-purple-700">
                  고도화된 데이터 관리 플랫폼으로 정확한 타겟팅을 실현합니다.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  Data 기반의 광고 소재 기획 및 제작
                </h2>
                <p className="text-purple-700">
                  데이터 분석 결과를 바탕으로 효과적인 광고 소재를 기획합니다.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  ROAS 기반의 퍼포먼스 극대화
                </h2>
                <p className="text-purple-700">
                  투자 대비 수익률을 최적화하여 성과를 극대화합니다.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                <h2 className="text-2xl font-bold text-purple-900 mb-3">
                  다양한 트래킹 툴 Data 바탕으로 랜딩 페이지 최적화 제안
                </h2>
                <p className="text-purple-700">
                  트래킹 데이터를 분석하여 랜딩 페이지를 지속적으로 개선합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

