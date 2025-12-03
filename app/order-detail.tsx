import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    MapPin,
    MessageSquare,
    Truck
} from 'lucide-react-native';
import React from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// Màu sắc chủ đạo (Blue Theme)
const COLORS = {
    background: '#f9fafb',
    white: '#ffffff',
    primary: '#3b82f6',
    text: '#111827',
    gray: '#6b7280',
    border: '#e5e7eb',
    success: '#22c55e',
    orange: '#f97316',
};

// Dữ liệu giả lập chi tiết (Trong thực tế sẽ fetch API theo ID)
const mockOrderDetail = {
    id: 1,
    orderNumber: 'DH002',
    status: 'shipping', // 'completed', 'shipping', 'preparing'
    date: '26/11/2025 10:30',
    address: {
        name: 'Nguyễn Văn A',
        phone: '0909 123 456',
        detail: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM'
    },
    items: [
        { id: 1, name: 'Phở bò đặc biệt', quantity: 2, price: 55000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=200' },
        { id: 2, name: 'Trà sữa trân châu', quantity: 1, price: 45000, image: 'https://images.unsplash.com/photo-1558981396-5fcf84bdf14d?w=200' },
    ],
    payment: {
        subtotal: 155000,
        shipping: 15000,
        discount: -10000,
        total: 160000,
        method: 'Thanh toán khi nhận hàng (COD)'
    },
    timeline: [
        { time: '10:30', title: 'Đã đặt hàng', active: true },
        { time: '10:35', title: 'Nhà hàng xác nhận', active: true },
        { time: '10:45', title: 'Tài xế đang giao', active: true },
        { time: '--:--', title: 'Giao thành công', active: false },
    ]
};


export default function OrderDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params; // Lấy ID đơn hàng từ params

    // Trong thực tế: Dùng ID để fetch dữ liệu. Ở đây dùng mockOrderDetail
    const order = mockOrderDetail;

    const renderStatusTimeline = () => {
        return (
            <View style={styles.timelineContainer}>
                {order.timeline.map((step, index) => (
                    <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <Text style={styles.timelineTime}>{step.time}</Text>
                        </View>
                        <View style={styles.timelineCenter}>
                            <View style={[styles.dot, step.active ? styles.dotActive : styles.dotInactive]} />
                            {index !== order.timeline.length - 1 && (
                                <View style={[styles.line, step.active ? styles.lineActive : styles.lineInactive]} />
                            )}
                        </View>
                        <View style={styles.timelineRight}>
                            <Text style={[styles.timelineTitle, step.active ? styles.textActive : styles.textInactive]}>
                                {step.title}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="white" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Order Status Card */}
                <View style={styles.card}>
                    <View style={styles.statusHeader}>
                        <View>
                            <Text style={styles.orderId}>Mã đơn: #{order.orderNumber}</Text>
                            <Text style={styles.orderDate}>Đặt lúc: {order.date}</Text>
                        </View>

                        <View style={styles.statusBadge}>
                            <Truck size={14} color="#3b82f6" style={{ marginRight: 4 }} />
                            <Text style={styles.statusText}>Đang giao hàng</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    {renderStatusTimeline()}
                </View>

                {/* Address Section */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Địa chỉ nhận hàng</Text>
                    <View style={styles.addressRow}>
                        <MapPin size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
                        <View style={styles.addressInfo}>
                            <Text style={styles.userName}>{order.address.name}</Text>
                            <Text style={styles.userPhone}>{order.address.phone}</Text>
                            <Text style={styles.userAddress}>{order.address.detail}</Text>
                        </View>
                    </View>
                </View>

                {/* Product List */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Danh sách món</Text>
                    {order.items.map((item) => (
                        <View key={item.id} style={styles.itemRow}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <View style={styles.itemMeta}>
                                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
                                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Payment Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Tạm tính</Text>
                        <Text style={styles.paymentValue}>{order.payment.subtotal.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Phí vận chuyển</Text>
                        <Text style={styles.paymentValue}>{order.payment.shipping.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Giảm giá</Text>
                        <Text style={[styles.paymentValue, { color: COLORS.success }]}>
                            {order.payment.discount.toLocaleString('vi-VN')}đ
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.paymentRow}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        <Text style={styles.totalValue}>{order.payment.total.toLocaleString('vi-VN')}đ</Text>
                    </View>
                    <View style={styles.paymentMethodBox}>
                        <Text style={styles.paymentMethodText}>{order.payment.method}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.supportButton}>
                    <MessageSquare size={20} color={COLORS.text} />
                    <Text style={styles.supportText}>Liên hệ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.trackButton}>
                    <Text style={styles.trackText}>Theo dõi đơn hàng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12,
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#1e40af',
        fontSize: 12,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    // Timeline
    timelineContainer: {
        marginTop: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        height: 48, // fixed height for segments
    },
    timelineLeft: {
        width: 50,
        alignItems: 'flex-end',
        marginRight: 12,
    },
    timelineTime: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: -2,
    },
    timelineCenter: {
        alignItems: 'center',
        width: 20,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        zIndex: 1,
    },
    dotActive: {
        backgroundColor: COLORS.primary,
    },
    dotInactive: {
        backgroundColor: '#e5e7eb',
    },
    line: {
        width: 2,
        flex: 1,
        marginTop: 2,
    },
    lineActive: {
        backgroundColor: '#bfdbfe',
    },
    lineInactive: {
        backgroundColor: '#f3f4f6',
    },
    timelineRight: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        marginTop: -4,
    },
    textActive: {
        color: COLORS.text,
        fontWeight: '500',
    },
    textInactive: {
        color: '#9ca3af',
    },
    // Address
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    userPhone: {
        fontSize: 13,
        color: COLORS.gray,
        marginVertical: 2,
    },
    userAddress: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
    },
    // Items
    itemRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    itemQuantity: {
        fontSize: 14,
        color: COLORS.gray,
    },
    // Payment
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: COLORS.gray,
    },
    paymentValue: {
        fontSize: 14,
        color: COLORS.text,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    paymentMethodBox: {
        marginTop: 12,
        backgroundColor: '#f3f4f6',
        padding: 10,
        borderRadius: 8,
    },
    paymentMethodText: {
        fontSize: 13,
        color: COLORS.text,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    supportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        height: 48,
        marginRight: 12,
    },
    supportText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    trackButton: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        height: 48,
    },
    trackText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    orderDate: {
        fontSize: 13,
        color: COLORS.gray,
        marginTop: 2,
    },

});