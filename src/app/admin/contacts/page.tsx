'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'PENDING' | 'RESPONDED' | 'CLOSED';
  createdAt: string;
  respondedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기 중',
  RESPONDED: '답변 완료',
  CLOSED: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RESPONDED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

export default function AdminContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadContacts();
  }, [statusFilter]);

  const loadContacts = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const token = await user.getIdToken();
      const url = statusFilter === 'all' 
        ? '/api/contact'
        : `/api/contact?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setContacts(data.data.contacts || []);
      }
    } catch (error) {
      console.error('Load contacts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`/api/contact/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        loadContacts();
      } else {
        alert(data.error?.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Update contact status error:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">문의 내역</h1>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('PENDING')}
          >
            대기 중
          </Button>
          <Button
            variant={statusFilter === 'RESPONDED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('RESPONDED')}
          >
            답변 완료
          </Button>
          <Button
            variant={statusFilter === 'CLOSED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('CLOSED')}
          >
            종료
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">문의 내역이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{contact.name}</CardTitle>
                    <CardDescription>
                      {contact.email} • {new Date(contact.createdAt).toLocaleString('ko-KR')}
                    </CardDescription>
                  </div>
                  <Badge className={STATUS_COLORS[contact.status]}>
                    {STATUS_LABELS[contact.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                  {contact.message}
                </p>
                <div className="flex gap-2">
                  {contact.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(contact.id, 'RESPONDED')}
                      >
                        답변 완료로 표시
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(contact.id, 'CLOSED')}
                      >
                        종료
                      </Button>
                    </>
                  )}
                  {contact.status === 'RESPONDED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(contact.id, 'CLOSED')}
                    >
                      종료
                    </Button>
                  )}
                  <a
                    href={`mailto:${contact.email}`}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    이메일 보내기
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

