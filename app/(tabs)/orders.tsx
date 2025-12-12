import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, Clock, Coffee, Package, Truck, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import Context & API
import apiOrder, { OrderData } from '../../api/apiOrder';
import apiOrderItem, { OrderItemData } from '../../api/apiOrderItem';
import { useAuth } from '../../context/AuthContext';

// Màu sắc chủ đạo
const COLORS = {
  background: '#f9fafb',
  white: '#ffffff',
  primary: '#3b82f6',
  text: '#111827',
  gray: '#f3f4f6',
  grayText: '#6b7280',
  border: '#e5e7eb',
  successBg: '#dcfce7',
  successText: '#166534',
  infoBg: '#dbeafe',
  infoText: '#1e40af',
  warningBg: '#ffedd5',
  warningText: '#9a3412',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  defaultBg: '#f3f4f6',
  defaultText: '#374151',
};

// Kiểu dữ liệu hiển thị (kết hợp Order và Items)
interface OrderDisplay extends OrderData {
  items: OrderItemData[];
}

type FilterType = 'all' | 'pending' | 'shipping' | 'completed' | 'cancelled';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<FilterType>('all');

  // --- Fetch Data ---
  const fetchOrders = async () => {
    if (!user) return;
    try {
      // 1. Lấy danh sách đơn hàng
      const orderRes = await apiOrder.getOrdersByUser(user.id);
      const rawOrders: OrderData[] = orderRes.results || [];
      const ordersWithItems: OrderDisplay[] = [];

      // 2. Lấy chi tiết items TUẦN TỰ (Sequential) thay vì Song song
      // Để tránh lỗi 429 khi có quá nhiều đơn hàng
      for (const order of rawOrders) {
        try {
          const itemsRes = await apiOrderItem.getItemsByOrderId(order.id);
          ordersWithItems.push({
            ...order,
            items: itemsRes.results || []
          });
        } catch (err) {
          // Nếu lỗi lấy item con, vẫn hiện đơn hàng nhưng ko có item
          console.warn(`Lỗi lấy items cho đơn ${order.id}`, err);
          ordersWithItems.push({ ...order, items: [] });
        }
      }

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // --- Filter Logic ---
  const filteredOrders = orders.filter((order) => {
    if (selectedType === 'all') return true;

    // Map các trạng thái con vào tab
    const status = order.status?.value;
    if (selectedType === 'pending') return status === 'pending' || status === 'preparing';
    if (selectedType === 'shipping') return status === 'shipping';
    if (selectedType === 'completed') return status === 'completed';
    if (selectedType === 'cancelled') return status === 'cancelled';

    return true;
  });

  // --- Helper: Config hiển thị theo trạng thái ---
  const getStatusConfig = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return { bg: COLORS.successBg, text: COLORS.successText, label: 'Hoàn thành', icon: CheckCircle };
      case 'shipping':
        return { bg: COLORS.infoBg, text: COLORS.infoText, label: 'Đang giao', icon: Truck };
      case 'preparing':
        return { bg: COLORS.warningBg, text: COLORS.warningText, label: 'Đang chuẩn bị', icon: Coffee };
      case 'pending':
        return { bg: COLORS.warningBg, text: COLORS.warningText, label: 'Chờ xác nhận', icon: Clock };
      case 'cancelled':
        return { bg: COLORS.dangerBg, text: COLORS.dangerText, label: 'Đã hủy', icon: XCircle };
      default:
        return { bg: COLORS.defaultBg, text: COLORS.defaultText, label: 'Chưa rõ', icon: AlertCircle };
    }
  };

  const handleDetailPress = (orderId: number) => {
    router.push({ pathname: '/order-detail', params: { id: orderId } });
  };

  // Format ngày
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {[
              { id: 'all', label: 'Tất cả', icon: Package },
              { id: 'pending', label: 'Đang xử lý', icon: Clock },
              { id: 'shipping', label: 'Đang giao', icon: Truck },
              { id: 'completed', label: 'Hoàn thành', icon: CheckCircle },
              { id: 'cancelled', label: 'Đã hủy', icon: XCircle },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedType(tab.id as FilterType)}
                style={[styles.filterTab, selectedType === tab.id ? styles.filterTabActive : styles.filterTabInactive]}
              >
                <tab.icon size={16} color={selectedType === tab.id ? 'white' : '#4b5563'} style={{ marginRight: 6 }} />
                <Text style={[styles.filterText, selectedType === tab.id && styles.filterTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Order List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status?.value || 'unknown');
              const StatusIcon = statusConfig.icon;

              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Header Card: Mã đơn + Ngày + Trạng thái */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderNumber}>#{order.order_number}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <StatusIcon size={14} color={statusConfig.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                    </View>
                  </View>

                  {/* Items List (Show max 3 items) */}
                  <View style={styles.itemsContainer}>
                    {order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                            <Text style={styles.itemQuantity}>x{Number(item.quantity)}</Text>
                          </View>
                          <Text style={styles.itemPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>Đang cập nhật chi tiết món...</Text>
                    )}
                  </View>

                  {/* Footer Card: Tổng tiền + Nút bấm */}
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalPrice}>{Number(order.total_price).toLocaleString('vi-VN')}đ</Text>
                  </View>

                  <View style={styles.actionButtons}>
                    {/* Logic hiển thị nút tùy trạng thái */}
                    {order.status?.value === 'completed' || order.status?.value === 'cancelled' ? (
                      <TouchableOpacity style={[styles.button, styles.primaryButton]}>
                        <Text style={styles.primaryButtonText}>Đặt lại</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.secondaryButton,
                        // Nếu chỉ có 1 nút thì nó full width
                        (order.status?.value !== 'completed' && order.status?.value !== 'cancelled') && { width: '100%' }
                      ]}
                      onPress={() => handleDetailPress(order.id)}
                    >
                      <Text style={styles.secondaryButtonText}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 16, paddingHorizontal: 20 },
  filterList: { paddingHorizontal: 20, paddingBottom: 4 },
  filterTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabInactive: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  filterTextActive: { color: 'white' },
  orderList: { paddingHorizontal: 20, paddingTop: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#9ca3af', fontSize: 16 },
  orderCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  orderNumber: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  orderDate: { fontSize: 12, color: COLORS.grayText, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  itemsContainer: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemName: { fontSize: 14, color: '#374151', flex: 1 },
  itemQuantity: { fontSize: 14, color: '#9ca3af', marginLeft: 8, minWidth: 24 },
  itemPrice: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f9fafb', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  actionButtons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: COLORS.primary },
  primaryButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  secondaryButton: { backgroundColor: '#f3f4f6' },
  secondaryButtonText: { color: '#374151', fontSize: 14, fontWeight: '500' },
});