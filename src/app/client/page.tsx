'use client';

import { TopNav } from '@/components/shared';

export default function ClientPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      
      <main className="pt-16">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-8">
              Client
            </h1>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p className="text-lg">
                I:EUM과 함께 성장하는 파트너들을 소개합니다.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-2">광고주</h3>
                  <p className="text-purple-700">
                    다양한 산업 분야의 광고주들이 I:EUM을 통해 효과적인 캠페인을 운영하고 있습니다.
                  </p>
                </div>
                
                <div className="p-6 rounded-2xl bg-purple-50/50 border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-2">인플루언서</h3>
                  <p className="text-purple-700">
                    수많은 인플루언서들이 I:EUM 플랫폼을 통해 새로운 협업 기회를 찾고 있습니다.
                  </p>
                </div>
              </div>
              
              <p className="mt-8">
                I:EUM은 지속적인 파트너십을 통해 함께 성장해 나가고 있습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

