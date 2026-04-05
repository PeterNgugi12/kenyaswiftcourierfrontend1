import { useState, useEffect, useCallback } from 'react';
import { smsApi, SMSLog, SMSStats } from '../api/sms';
import { toast } from 'react-hot-toast';

export const useSMS = () => {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [loading, setLoading] = useState({
    logs: false,
    stats: false,
    resend: false
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    setLoading(prev => ({ ...prev, logs: true }));
    try {
      const params: any = { page, limit };
      if (status) params.status = status;
      if (companyId) params.company_id = companyId;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      
      const response = await smsApi.getLogs(params);
      setLogs(response.data.data);
      setTotal(response.data.total);
    } catch (error: any) {
      console.error('Failed to fetch SMS logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch SMS logs');
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  }, [page, limit, status, companyId, fromDate, toDate]);

  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await smsApi.getStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch SMS stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const resendSMS = async (id: string) => {
    setLoading(prev => ({ ...prev, resend: true }));
    try {
      const response = await smsApi.resendSMS(id);
      toast.success(response.message || 'SMS resent successfully');
      // Refresh logs after resend
      fetchLogs();
      fetchStats();
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend SMS');
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, resend: false }));
    }
  };

  const refresh = () => {
    fetchLogs();
    fetchStats();
  };

  // Format time from ISO date
  const formatTime = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-KE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Transform logs for UI
  // Transform logs for UI
const transformedLogs = logs.map(log => {
  // Safely parse the cost
  let costValue = 0;
  if (log.cost) {
    if (typeof log.cost === 'number') {
      costValue = log.cost;
    } else if (typeof log.cost === 'string') {
      costValue = parseFloat(log.cost) || 0;
    }
  }

  return {
    id: log.id,
    sms_id: `SMS-${log.id.slice(0, 8)}`,
    to: log.phone_number,
    receiver: log.receiver_name || 'Unknown',
    tracking: log.parcel?.tracking_number || 'N/A',
    message: log.message,
    status: log.status,
    time: formatTime(log.sent_at || log.created_at),
    date: formatDate(log.created_at),
    cost: `KES ${costValue.toFixed(1)}`,
    raw: log
  };
});
  // Get stats for UI
  const uiStats = stats ? {
    sentToday: stats.today.sent.toLocaleString(),
    deliveredToday: stats.today.delivered.toLocaleString(),
    failedToday: stats.today.failed.toLocaleString(),
    pendingToday: stats.today.pending.toLocaleString(),
    totalCost: `KES ${stats.today.total_cost.toFixed(1)}`,
    deliveryRate: stats.delivery_rate.toFixed(1)
  } : {
    sentToday: '0',
    deliveredToday: '0',
    failedToday: '0',
    pendingToday: '0',
    totalCost: 'KES 0',
    deliveryRate: '0'
  };

  return {
    logs: transformedLogs,
    stats,
    uiStats,
    loading,
    total,
    page,
    setPage,
    status,
    setStatus,
    companyId,
    setCompanyId,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    resendSMS,
    refresh,
    // Filter options for UI
    statusOptions: [
      { value: '', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'sent', label: 'Sent' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'failed', label: 'Failed' }
    ]
  };
};