import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckSquare, Edit2, MapPin, Plus, Square, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, // Import thêm KeyboardAvoidingView
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Context & API
import apiAddress, { AddressData } from '../api/apiAddress';
import { useAuth } from '../context/AuthContext';

// Màu sắc chủ đạo (Đồng bộ)
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  bg: '#f9fafb',
  white: '#ffffff',
  gray: '#f3f4f6',
  border: '#e5e7eb',
  green: '#22c55e',
  greenBg: '#dcfce7',
  red: '#ef4444',
  redBg: '#fef2f2',
  blueBg: '#eff6ff',
};

export default function AddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // --- State ---
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // State để biết đang sửa ID nào
  const [addressForm, setAddressForm] = useState({
    label: 'Nhà riêng',
    phone: '',
    detail: '',
    isDefault: false, // Thêm trạng thái mặc định vào form
  });

  // --- Fetch Data ---
  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const res = await apiAddress.getAddressesByUser(user.id);
      setAddresses(res.results || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách địa chỉ:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  // --- Handlers ---
  
  // Mở modal để THÊM MỚI
  const openAddModal = () => {
    setEditingId(null);
    setAddressForm({ 
        label: 'Nhà riêng', 
        phone: '', 
        detail: '',
        isDefault: addresses.length === 0 // Nếu chưa có địa chỉ nào thì mặc định là true
    });
    setModalVisible(true);
  };

  // Mở modal để SỬA
  const openEditModal = (addr: AddressData) => {
    setEditingId(addr.id);
    setAddressForm({
        label: addr.label,
        phone: addr.phone,
        detail: addr.detail,
        isDefault: addr.is_default
    });
    setModalVisible(true);
  };

  // Xử lý Xóa
  const handleDelete = (id: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa địa chỉ này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              await apiAddress.deleteAddress(id);
              // Refresh list locally
              setAddresses(prev => prev.filter(addr => addr.id !== id));
              Alert.alert("Thành công", "Đã xóa địa chỉ.");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa địa chỉ.");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressForm.detail.trim() || !addressForm.phone.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số điện thoại và địa chỉ chi tiết.");
      return;
    }

    try {
      setIsProcessing(true);

      // --- LOGIC ĐẢM BẢO CHỈ CÓ 1 ĐỊA CHỈ MẶC ĐỊNH ---
      // Nếu người dùng tick chọn "Đặt làm mặc định"
      if (addressForm.isDefault) {
         // Tìm địa chỉ đang là mặc định trong danh sách hiện tại
         const currentDefault = addresses.find(addr => addr.is_default);
         
         // Nếu tìm thấy và địa chỉ đó KHÔNG PHẢI là địa chỉ đang được sửa (tránh update chính nó)
         if (currentDefault && currentDefault.id !== editingId) {
             // Gọi API để tắt trạng thái mặc định của địa chỉ cũ
             await apiAddress.updateAddress(currentDefault.id, { is_default: false });
         }
      }

      if (editingId) {
        // --- LOGIC SỬA ---
        await apiAddress.updateAddress(editingId, {
            label: addressForm.label,
            detail: addressForm.detail,
            phone: addressForm.phone,
            is_default: addressForm.isDefault
        });
        Alert.alert("Thành công", "Cập nhật địa chỉ thành công!");
      } else {
        // --- LOGIC THÊM MỚI ---
        // Nếu là địa chỉ đầu tiên thì luôn là mặc định
        const shouldBeDefault = addresses.length === 0 ? true : addressForm.isDefault;
        
        await apiAddress.createAddress({
            label: addressForm.label,
            detail: addressForm.detail,
            phone: addressForm.phone,
            is_default: shouldBeDefault,
            user_id: [user.id]
        });
        Alert.alert("Thành công", "Thêm địa chỉ mới thành công!");
      }
      
      setModalVisible(false);
      setAddressForm({ label: 'Nhà riêng', phone: '', detail: '', isDefault: false }); // Reset form
      setEditingId(null);
      fetchAddresses(); // Reload lại danh sách để cập nhật UI
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể lưu địa chỉ.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header với Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </SafeAreaView>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.addressList}>
            {addresses.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={{color: '#9ca3af'}}>Chưa có địa chỉ nào.</Text>
                </View>
            ) : (
                addresses.map((address) => (
                    <View key={address.id} style={styles.addressCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                        <MapPin size={20} color={COLORS.green} />
                        </View>
                        <View style={styles.cardInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.nameText}>{address.label}</Text>
                            {address.is_default && (
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>Mặc định</Text>
                            </View>
                            )}
                        </View>
                        <Text style={styles.phoneText}>{address.phone}</Text>
                        <Text style={styles.addressText}>{address.detail}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => openEditModal(address)} // Mở modal sửa
                        >
                            <Edit2 size={16} color={COLORS.textLight} style={{ marginRight: 6 }} />
                            <Text style={styles.actionText}>Sửa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDelete(address.id)}
                            disabled={isProcessing}
                        >
                            <Trash2 size={16} color={COLORS.red} style={{ marginRight: 6 }} />
                            <Text style={styles.deleteText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                ))
            )}
            </View>
            
            <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Add Address Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.addButtonWrapper}
          onPress={openAddModal} // Mở modal thêm mới
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButton}
          >
            <Plus size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal Thêm/Sửa Địa Chỉ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Sử dụng KeyboardAvoidingView để xử lý bàn phím */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  {/* Sử dụng ScrollView để có thể cuộn khi bàn phím hiện lên */}
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nhãn (Ví dụ: Nhà riêng, Công ty)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={addressForm.label}
                            onChangeText={(text) => setAddressForm({...addressForm, label: text})}
                            placeholder="Nhà riêng"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Số điện thoại nhận hàng</Text>
                        <TextInput 
                            style={styles.input} 
                            value={addressForm.phone}
                            onChangeText={(text) => setAddressForm({...addressForm, phone: text})}
                            placeholder="09xx..."
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Địa chỉ chi tiết</Text>
                        <TextInput 
                            style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                            value={addressForm.detail}
                            onChangeText={(text) => setAddressForm({...addressForm, detail: text})}
                            placeholder="Số nhà, tên đường, phường/xã..."
                            multiline
                        />
                    </View>

                    {/* Nút đặt làm mặc định */}
                    <TouchableOpacity 
                        style={styles.checkboxContainer}
                        onPress={() => setAddressForm({...addressForm, isDefault: !addressForm.isDefault})}
                    >
                        {addressForm.isDefault ? (
                            <CheckSquare size={20} color={COLORS.primary} />
                        ) : (
                            <Square size={20} color={COLORS.textLight} />
                        )}
                        <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveAddress}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.saveButtonText}>
                                {editingId ? 'Cập nhật' : 'Lưu địa chỉ'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    {/* Thêm khoảng trống dưới cùng để tránh sát mép khi cuộn */}
                    <View style={{ height: 20 }} />
                  </ScrollView>
              </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContent: {
    padding: 20,
  },
  addressList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: COLORS.blueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  editButton: {
    borderColor: COLORS.border,
    backgroundColor: 'white',
  },
  deleteButton: {
    borderColor: '#fecaca', // red-200
    backgroundColor: 'white',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.red,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  addButtonWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%', // Giới hạn chiều cao modal để tránh bị tràn màn hình khi phím hiện lên
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});