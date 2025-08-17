import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 토큰 제거
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// API 함수들
export const apiService = {
  // 서버 상태 확인
  getHealth: () => api.get('/api/health'),
  
  // 데이터베이스 연결 테스트
  testDatabase: () => api.get('/api/db-test'),
  
  // 인증 관련 API
  login: (credentials: { username: string; password: string }) => 
    api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/me'),
  
  // 사용자 관련 API
  getUsers: () => api.get('/api/users'),
  getUser: (id: number) => api.get(`/api/users/${id}`),
  createUser: (userData: { 
    username: string; 
    email: string; 
    password: string;
    companyName?: string;
    contactPerson?: string;
    phoneNumber?: string;
  }) => api.post('/api/users', userData),
  updateUser: (id: number, userData: { username: string; email: string; is_admin?: boolean }) => 
    api.put(`/api/users/${id}`, userData),
  updateUserProfile: (id: number, userData: { 
    username: string; 
    email: string; 
    company_name?: string;
    contact_person?: string;
    phone_number?: string;
    business_name?: string;
    business_number?: string;
    business_address?: string;
    ceo_name?: string;
    tax_email?: string;
  }) => api.patch(`/api/users/${id}/profile`, userData),
  updateUserAdmin: (id: number, is_admin: boolean) => 
    api.patch(`/api/users/${id}/admin`, { is_admin }),
  deleteUser: (id: number) => api.delete(`/api/users/${id}`),
  
  // VIP 파트너스 관련 API
  getVipPartners: () => api.get('/api/vip-partners'),
  getVipPartner: (id: number) => api.get(`/api/vip-partners/${id}`),
  createVipPartner: (partnerData: { name: string }) => api.post('/api/vip-partners', partnerData),
  updateVipPartner: (id: number, partnerData: { name: string }) => api.put(`/api/vip-partners/${id}`, partnerData),
  deleteVipPartner: (id: number) => api.delete(`/api/vip-partners/${id}`),
  
  // 사용자 파트너스 관리 API
  assignPartnerToUser: (userId: number, partnerId: number) => 
    api.post(`/api/users/${userId}/partners`, { partner_id: partnerId }),
  getUserPartners: (userId: number) => 
    api.get(`/api/users/${userId}/partners`),
  removePartnerFromUser: (userId: number, partnerId: number) => 
    api.delete(`/api/users/${userId}/partners/${partnerId}`),
  
  // 작업상태 관리 API
  getWorkStatuses: (category: string, statusType?: string) => {
    const url = statusType 
      ? `/api/work-statuses/${category}?status_type=${statusType}`
      : `/api/work-statuses/${category}`;
    return api.get(url);
  },
  getWorkStatus: (id: number) => 
    api.get(`/api/work-statuses/${id}`),
  createWorkStatus: (statusData: { 
    name: string; 
    description?: string; 
    color: string; 
    order: number; 
    is_active: boolean;
    category: string;
    status_type: string;
  }) => api.post('/api/work-statuses', statusData),
  updateWorkStatus: (id: number, statusData: { 
    name?: string; 
    description?: string; 
    color?: string; 
    order?: number; 
    is_active?: boolean;
    category?: string;
    status_type?: string;
  }) => api.put(`/api/work-statuses/${id}`, statusData),
  deleteWorkStatus: (id: number) => 
    api.delete(`/api/work-statuses/${id}`),
  reorderAllWorkStatuses: () => 
    api.post('/api/work-statuses/reorder-all'),
  removeDuplicateWorkStatuses: () => 
    api.post('/api/work-statuses/remove-duplicates'),
  checkDuplicateWorkStatuses: () => 
    api.get('/api/work-statuses/check-duplicates'),

  // MJ 프로젝트 상태 조회 API
  getMJProjectStatuses: () => api.get('/api/work-statuses/mj?status_type=work'),
  getMJPaymentStatuses: () => api.get('/api/work-statuses/mj?status_type=payment'),
  getMJDeliveryStatuses: () => api.get('/api/work-statuses/mj?status_type=delivery'),
  
  // MJ 프로젝트 수정 API
  updateMJProjectQuantity: (id: number, quantity: number) => 
    api.patch(`/api/mj-projects/${id}/quantity`, { quantity }),
  updateMJProjectPrice: (id: number, price: number) => 
    api.patch(`/api/mj-projects/${id}/price`, { price }),
  updateMJProjectPurchaseLink: (id: number, purchaseLink: string) => 
    api.patch(`/api/mj-projects/${id}/purchase-link`, { purchaseLink }),
  updateMJProjectExpectedShippingDate: (id: number, expected_shipping_date: string | null) => 
    api.patch(`/api/mj-projects/${id}/expected-shipping-date`, { expected_shipping_date }),
  updateMJProjectProductionDays: (id: number, production_days: number | null) => 
    api.patch(`/api/mj-projects/${id}/production-days`, { production_days }),
  updateMJProjectLogisticCost: (id: number, logistic_cost: number | null) => 
    api.patch(`/api/mj-projects/${id}/logistic-cost`, { logistic_cost }),
  updateMJProjectCommissionRate: (id: number, commission_rate: number) => 
    api.patch(`/api/mj-projects/${id}/commission-rate`, { commission_rate }),
  updateMJProjectCommission: (id: number, commission: number) => 
    api.patch(`/api/mj-projects/${id}/commission`, { commission }),
  updateMJProjectTotalPayment: (id: number, total_payment: number) => 
    api.patch(`/api/mj-projects/${id}/total-payment`, { total_payment }),
  updateMJProjectDeliveryStatus: (id: number, delivery_status: string) => 
    api.patch(`/api/mj-projects/${id}/delivery-status`, { delivery_status }),
  
  // 기본 서버 정보
  getServerInfo: () => api.get('/'),
};

export default api; 