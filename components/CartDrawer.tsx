import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react-native';
import React from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRouter } from 'expo-router'; // Import useRouter
import { SafeAreaView } from "react-native-safe-area-context";

import { CartItem, useCart } from '../context/CartContext';

// Màu sắc chủ đạo (Blue Theme)
const COLORS = {
    background: '#ffffff',
    primary: '#3b82f6',
    text: '#111827',
    gray: '#f3f4f6',
    grayText: '#6b7280',
    border: '#e5e7eb',
    red: '#ef4444',
    redBg: '#fef2f2',
};

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
    const router = useRouter(); // Khởi tạo router

    // Hàm xử lý chuyển trang thanh toán
    const handleCheckoutPress = () => {
        onClose(); // Đóng Drawer trước
        router.push('/checkout'); // Chuyển sang màn hình checkout
    };

    return (
        <Modal
            visible={isOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                {/* Drawer Content */}
                <View style={styles.drawerContainer}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.container}>

                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <ShoppingBag size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.headerTitle}>Giỏ hàng</Text>
                                    {items.length > 0 && (
                                        <Text style={styles.itemCount}>({items.length})</Text>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.closeButton}
                                >
                                    <X size={20} color="#4b5563" />
                                </TouchableOpacity>
                            </View>

                            {/* Cart Items List */}
                            <View style={styles.content}>
                                {items.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconContainer}>
                                            <ShoppingBag size={48} color="#9ca3af" />
                                        </View>
                                        <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
                                        <Text style={styles.emptySubtitle}>
                                            Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        contentContainerStyle={[styles.itemsList, { flexGrow: 1 }]}
                                    >
                                        {items.map((item: CartItem) => (
                                            <View key={item.id} style={styles.cartItem}>
                                                {/* Product Image */}
                                                <View style={styles.imageContainer}>
                                                    <Image
                                                        source={{ uri: item.image }}
                                                        style={styles.productImage}
                                                        resizeMode="cover"
                                                    />
                                                </View>

                                                {/* Product Details */}
                                                <View style={styles.itemDetails}>
                                                    <Text style={styles.itemName} numberOfLines={1}>
                                                        {item.name}
                                                    </Text>
                                                    <Text style={styles.itemPrice}>
                                                        {item.price.toLocaleString('vi-VN')}đ
                                                    </Text>

                                                    {/* Actions Row */}
                                                    <View style={styles.actionsRow}>
                                                        <View style={styles.quantityControl}>
                                                            <TouchableOpacity
                                                                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                                                style={styles.qtyButton}
                                                            >
                                                                <Minus size={14} color="#4b5563" />
                                                            </TouchableOpacity>

                                                            <Text style={styles.qtyText}>{item.quantity}</Text>

                                                            <TouchableOpacity
                                                                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                                                style={styles.qtyButton}
                                                            >
                                                                <Plus size={14} color="#4b5563" />
                                                            </TouchableOpacity>
                                                        </View>

                                                        <TouchableOpacity
                                                            onPress={() => removeFromCart(item.id)}
                                                            style={styles.removeButton}
                                                        >
                                                            <Trash2 size={16} color={COLORS.red} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}

                                        {items.length > 0 && (
                                            <TouchableOpacity
                                                onPress={clearCart}
                                                style={styles.clearButton}
                                            >
                                                <Text style={styles.clearButtonText}>Xóa tất cả</Text>
                                            </TouchableOpacity>
                                        )}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Footer Total & Checkout */}
                            {items.length > 0 && (
                                <View style={styles.footer}>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                                        <Text style={styles.totalPrice}>
                                            {getTotalPrice().toLocaleString('vi-VN')}đ
                                        </Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.checkoutButton}
                                        onPress={handleCheckoutPress} // Gọi hàm điều hướng
                                    >
                                        <Text style={styles.checkoutText}>Thanh toán</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawerContainer: {
        width: '85%',
        maxWidth: 400,
        height: '100%',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    itemCount: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.grayText,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.gray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    itemsList: {
        padding: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        backgroundColor: COLORS.gray,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.grayText,
        textAlign: 'center',
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        gap: 12,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 2,
    },
    qtyButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 6,
    },
    qtyText: {
        minWidth: 24,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.text,
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.redBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 14,
        color: COLORS.red,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: 'white',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        color: COLORS.grayText,
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    checkoutButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    checkoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});