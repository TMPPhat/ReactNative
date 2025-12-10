import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    Camera,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Mail,
    Phone,
    User,
    Users,
    X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// Import thư viện ImagePicker
import * as ImagePicker from 'expo-image-picker';

// Import Auth Context & API
import apiUser from '../api/apiUser';
import { useAuth } from '../context/AuthContext';

// Màu sắc chủ đạo
const COLORS = {
  primary: '#3b82f6',
  secondary: '#4f46e5',
  text: '#111827',
  textLight: '#6b7280',
  bg: '#f9fafb',
  white: '#ffffff',
  gray: '#f3f4f6',
  border: '#e5e7eb',
  blueBg: '#eff6ff',
};

// --- COMPONENT CHỌN NGÀY TỰ DỰNG (Custom DatePicker) ---
const CustomDatePicker = ({ visible, currentDate, onClose, onSelect }: any) => {
  const initialDate = currentDate ? new Date(currentDate) : new Date(1995, 0, 1);
  const [viewDate, setViewDate] = useState(initialDate);
  const [showYearPicker, setShowYearPicker] = useState(false); 

  useEffect(() => {
    if (visible) {
      setViewDate(currentDate ? new Date(currentDate) : new Date(1995, 0, 1));
      setShowYearPicker(false); 
    }
  }, [currentDate, visible]);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onSelect(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, viewDate.getMonth(), 1);
    setViewDate(newDate);
    setShowYearPicker(false); 
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(month, year);
    const startDay = firstDayOfMonth(month, year); 

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    for (let i = 1; i <= totalDays; i++) {
      const isSelected = currentDate &&
        currentDate.getDate() === i &&
        currentDate.getMonth() === month &&
        currentDate.getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
          onPress={() => handleDayPress(i)}
        >
          <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const renderYearList = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 1900; i--) {
      years.push(i);
    }

    return (
      <FlatList
        data={years}
        keyExtractor={(item) => item.toString()}
        style={{ height: 300 }}
        initialNumToRender={20}
        getItemLayout={(data, index) => (
          { length: 50, offset: 50 * index, index }
        )}
        initialScrollIndex={currentYear - viewDate.getFullYear()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.yearItem, 
              item === viewDate.getFullYear() && styles.yearItemSelected
            ]}
            onPress={() => handleYearSelect(item)}
          >
            <Text style={[
              styles.yearText,
              item === viewDate.getFullYear() && styles.yearTextSelected
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateTitle}>
              {showYearPicker ? 'Chọn năm sinh' : 'Chọn ngày sinh'}
            </Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
          </View>

          {!showYearPicker ? (
            <>
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                  <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.monthYearButton} 
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={styles.monthText}>
                    Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
                  </Text>
                  <ChevronDown size={16} color="#374151" style={{marginLeft: 4}} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                  <ChevronRight size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                  <Text key={d} style={styles.weekText}>{d}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {renderCalendarDays()}
              </View>
            </>
          ) : (
            <View>
              {renderYearList()}
              <TouchableOpacity 
                style={styles.closeYearPicker}
                onPress={() => setShowYearPicker(false)}
              >
                <Text style={{color: COLORS.primary, fontWeight: '600'}}>Quay lại lịch</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuth(); 

  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null; 
    try {
      const parts = dateStr.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } catch (e) {
      return null;
    }
  };

  interface FormData {
    name: string;
    email: string;
    phone: string;
    birthday: Date | null;
    gender: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    birthday: null, 
    gender: 'Nam',
  });

  // State cho ảnh avatar mới
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: parseDate(user.birthday),
        gender: user.gender?.value || 'Nam', 
      });
    }
  }, [user]);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Chưa cập nhật';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatDateForApi = (date: Date | null) => {
    if (!date) return ''; 
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // --- XỬ LÝ CHỌN ẢNH ---
  const handlePickImage = async (mode: 'camera' | 'library') => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        // CẬP NHẬT: Dùng MediaTypeOptions để tránh lỗi biên dịch như bạn yêu cầu
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      };

      if (mode === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera để chụp ảnh.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        setLocalAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Lỗi chọn ảnh:', error);
    } finally {
      setShowAvatarOptions(false);
    }
  };

  const handleSave = async () => {
    const phoneRegex = /^\d{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      Alert.alert('Lỗi', 'Số điện thoại phải bao gồm đúng 10 chữ số.');
      return;
    }

    let imagePayload = undefined;

    // Nếu có ảnh mới, thực hiện upload trước
    if (localAvatarUri) {
        setIsUploading(true);
        try {
            // 1. Upload ảnh lên Baserow
            const uploadRes = await apiUser.uploadFile(localAvatarUri);
            
            // 2. Baserow yêu cầu payload update file là mảng các object có name
            if (uploadRes && uploadRes.name) {
                imagePayload = [{ name: uploadRes.name }];
            }
        } catch (error) {
            console.error("Upload failed", error);
            Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
            setIsUploading(false);
            return;
        }
    }

    // 3. Cập nhật thông tin User (kèm ảnh nếu có)
    const success = await updateProfile({
      name: formData.name,
      phone: formData.phone,
      birthday: formData.birthday ? formatDateForApi(formData.birthday) : '', 
      gender: formData.gender,
      image: imagePayload // Truyền mảng ảnh vào đây
    });

    setIsUploading(false); 

    if (success) {
      router.back(); 
    }
  };

  const genderOptions = ['Nam', 'Nữ', 'Khác'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCard}>
            {/* Ưu tiên hiển thị ảnh mới chọn (local) -> ảnh từ server -> default */}
            {localAvatarUri ? (
               <Image source={{ uri: localAvatarUri }} style={styles.avatarImage} />
            ) : user?.AvatarUrl ? (
              <Image source={{ uri: user.AvatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.avatarCircle}>
                <User size={48} color="white" />
              </LinearGradient>
            )}
            
            <TouchableOpacity onPress={() => setShowAvatarOptions(true)}>
              <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          {/* Họ tên */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputRow}>
              <User size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
                placeholderTextColor={COLORS.textLight}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Giới tính */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.inputRow}>
              <Users size={20} color="#9ca3af" style={styles.inputIcon} />
              <View style={styles.genderOptionsContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => !isLoading && setFormData({ ...formData, gender: option })}
                    style={[
                      styles.genderOption,
                      formData.gender === option && styles.genderOptionActive
                    ]}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.genderText,
                      formData.gender === option && styles.genderTextActive
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={[styles.inputCard, { opacity: 0.7 }]}>
            <Text style={styles.label}>Email (Không thể thay đổi)</Text>
            <View style={styles.inputRow}>
              <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={formData.email}
                editable={false} 
                style={styles.input}
                keyboardType="email-address"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* SĐT */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputRow}>
              <Phone size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="Chưa cập nhật"
                placeholderTextColor={COLORS.textLight}
                editable={!isLoading}
                maxLength={10} 
              />
            </View>
          </View>

          {/* Ngày sinh */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => !isLoading && setShowDatePicker(true)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Calendar size={20} color="#9ca3af" style={styles.inputIcon} />
              <Text style={[
                styles.inputText, 
                !formData.birthday && { color: COLORS.textLight, fontStyle: 'italic' }
              ]}>
                {formatDate(formData.birthday)}
              </Text>
            </TouchableOpacity>
          </View>

          <CustomDatePicker
            visible={showDatePicker}
            currentDate={formData.birthday}
            onClose={() => setShowDatePicker(false)}
            onSelect={(date: Date) => {
              setFormData({ ...formData, birthday: date });
              setShowDatePicker(false);
            }}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.saveButtonWrapper, (isLoading || isUploading) && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isLoading || isUploading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              {(isLoading || isUploading) ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Chọn Ảnh */}
      <Modal
        visible={showAvatarOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAvatarOptions(false)}
      >
        <View style={styles.modalOverlay}>
            <TouchableOpacity 
                style={StyleSheet.absoluteFill} 
                onPress={() => setShowAvatarOptions(false)} 
            />
            <View style={styles.optionsContainer}>
                <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>Đổi ảnh đại diện</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.optionItem}
                    onPress={() => handlePickImage('camera')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                        <Camera size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.optionText}>Chụp ảnh mới</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity 
                    style={styles.optionItem}
                    onPress={() => handlePickImage('library')}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                        <ImageIcon size={24} color={COLORS.secondary} />
                    </View>
                    <Text style={styles.optionText}>Chọn từ thư viện</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setShowAvatarOptions(false)}
                >
                    <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: 20,
  },

  // Avatar
  avatarSection: {
    marginTop: 15,
    alignItems: 'center',
    marginBottom: 20,
  },

  avatarCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    backgroundColor: COLORS.gray,
  },

  changeAvatarText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Form
  formSection: {
    gap: 16,
    paddingBottom: 40,
  },

  inputCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  label: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 4,
  },

  inputText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 8,
  },

  // Gender
  genderOptionsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },

  genderOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  genderOptionActive: {
    backgroundColor: COLORS.blueBg,
    borderColor: COLORS.primary,
  },

  genderText: {
    fontSize: 14,
    color: COLORS.textLight,
  },

  genderTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Save Button
  saveButtonWrapper: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Custom DatePicker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    maxWidth: 350,
    maxHeight: '80%', 
  },

  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  navBtn: {
    padding: 8,
  },

  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
  },

  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  weekText: {
    width: 40,
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  dayCellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },

  dayText: {
    fontSize: 14,
    color: COLORS.text,
  },

  dayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },

  yearItem: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  yearItemSelected: {
    backgroundColor: COLORS.blueBg,
  },
  yearText: {
    fontSize: 16,
    color: COLORS.text,
  },
  yearTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  closeYearPicker: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },

  // Avatar Options Modal Styles
  optionsContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    position: 'absolute',
    bottom: 30, // Show at bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  optionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  }

});