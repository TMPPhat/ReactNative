import { useRouter } from 'expo-router'; // Import Router
import { CheckCircle, Clock, Coffee, Package, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- Dữ liệu giả lập ---
type OrderType = 'all' | 'purchased' | 'delivery' | 'dine-in';

const orders = [
  {
    id: 1,
    type: 'purchased',
    orderNumber: 'DH001',
    date: '2025-11-25',
    items: [
      { name: 'Cà phê sữa đá', quantity: 2, price: 35000 },
      { name: 'Bánh mì thịt', quantity: 1, price: 25000 },
    ],
    total: 95000,
    status: 'completed',
  },
  {
    id: 2,
    type: 'delivery',
    orderNumber: 'DH002',
    date: '2025-11-26',
    items: [
      { name: 'Phở bò', quantity: 2, price: 55000 },
      { name: 'Trà sữa trân châu', quantity: 1, price: 45000 },
    ],
    total: 155000,
    status: 'shipping',
    address: '123 Nguyễn Huệ, Q.1, TP.HCM',
  },
  {
    id: 3,
    type: 'dine-in',
    orderNumber: 'DH003',
    date: '2025-11-26',
    items: [
      { name: 'Cơm gà', quantity: 1, price: 45000 },
      { name: 'Nước ép cam', quantity: 1, price: 40000 },
    ],
    total: 85000,
    status: 'preparing',
    tableNumber: 'Bàn 5',
  },
  {
    id: 4,
    type: 'purchased',
    orderNumber: 'DH004',
    date: '2025-11-24',
    items: [
      { name: 'Tiramisu', quantity: 1, price: 45000 },
      { name: 'Smoothie dâu', quantity: 1, price: 50000 },
    ],
    total: 95000,
    status: 'completed',
  },
];

// Màu sắc chủ đạo (Blue Theme)
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
  defaultBg: '#f3f4f6',
  defaultText: '#374151',
};

export default function OrdersScreen() {
  const router = useRouter(); // Khởi tạo router
  const [selectedType, setSelectedType] = useState<OrderType>('all');

  const filteredOrders = orders.filter((order) => 
    selectedType === 'all' ? true : order.type === selectedType
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { bg: COLORS.successBg, text: COLORS.successText, label: 'Hoàn thành', icon: CheckCircle };
      case 'shipping': return { bg: COLORS.infoBg, text: COLORS.infoText, label: 'Đang giao', icon: Truck };
      case 'preparing': return { bg: COLORS.warningBg, text: COLORS.warningText, label: 'Đang chuẩn bị', icon: Clock };
      default: return { bg: COLORS.defaultBg, text: COLORS.defaultText, label: status, icon: Package };
    }
  };

  // Hàm chuyển hướng
  const handleDetailPress = (orderId: number) => {
    router.push({ pathname: '/order-detail', params: { id: orderId } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {[
              { id: 'all', label: 'Tất cả', icon: Package },
              { id: 'purchased', label: 'Đã mua', icon: CheckCircle },
              { id: 'delivery', label: 'Giao hàng', icon: Truck },
              { id: 'dine-in', label: 'Tại bàn', icon: Coffee },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedType(tab.id as OrderType)}
                style={[styles.filterTab, selectedType === tab.id ? styles.filterTabActive : styles.filterTabInactive]}
              >
                <tab.icon size={16} color={selectedType === tab.id ? 'white' : '#4b5563'} style={{ marginRight: 6 }} />
                <Text style={[styles.filterText, selectedType === tab.id && styles.filterTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.orderList} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#d1d5db" style={{marginBottom: 16}} />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <StatusIcon size={14} color={statusConfig.text} style={{marginRight: 4}} />
                    <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                  </View>
                </View>

                <View style={styles.itemsContainer}>
                  {order.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalPrice}>{order.total.toLocaleString('vi-VN')}đ</Text>
                </View>

                <View style={styles.actionButtons}>
                  {order.status === 'completed' ? (
                    <>
                      <TouchableOpacity style={[styles.button, styles.primaryButton]}>
                        <Text style={styles.primaryButtonText}>Đặt lại</Text>
                      </TouchableOpacity>
                      {/* Nút Chi tiết có chức năng chuyển hướng */}
                      <TouchableOpacity 
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => handleDetailPress(order.id)}
                      >
                        <Text style={styles.secondaryButtonText}>Chi tiết</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.button, styles.secondaryButton, { width: '100%' }]}
                      onPress={() => handleDetailPress(order.id)}
                    >
                      <Text style={styles.secondaryButtonText}>Chi tiết</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', zIndex: 10 },
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
  extraInfo: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f9fafb', padding: 8, borderRadius: 8, marginBottom: 12 },
  extraInfoText: { fontSize: 12, color: '#4b5563', flex: 1 },
});