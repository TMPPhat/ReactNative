import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Mail, Phone, User, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

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
// Giúp chạy được ngay mà không cần cài @react-native-community/datetimepicker
const CustomDatePicker = ({ visible, currentDate, onClose, onSelect }: any) => {
    const [viewDate, setViewDate] = useState(new Date(currentDate));

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.setMonth(viewDate.getMonth() + offset));
        setViewDate(new Date(newDate));
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onSelect(newDate);
    };

    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const totalDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year); // 0 = Sunday

        const days = [];
        // Padding days
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }
        // Real days
        for (let i = 1; i <= totalDays; i++) {
            const isSelected =
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

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.datePickerContainer}>
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateTitle}>Chọn ngày sinh</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>

                    {/* Month Navigation */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                            <ChevronLeft size={20} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>
                            Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                            <ChevronRight size={20} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Weekday Headers */}
                    <View style={styles.weekRow}>
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
                            <Text key={d} style={styles.weekText}>{d}</Text>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {renderCalendarDays()}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function ProfileEditScreen() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: 'Nguyễn Văn A',
        email: 'nguyen.vana@email.com',
        phone: '0912345678',
        birthday: new Date(1990, 0, 1),
        gender: 'Nam',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    // Format ngày hiển thị
    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
                        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.avatarCircle}>
                            <User size={48} color="white" />
                        </LinearGradient>
                        <TouchableOpacity>
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
                                        onPress={() => setFormData({ ...formData, gender: option })}
                                        style={[
                                            styles.genderOption,
                                            formData.gender === option && styles.genderOptionActive
                                        ]}
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
                    <View style={styles.inputCard}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputRow}>
                            <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
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
                                placeholderTextColor={COLORS.textLight}
                            />
                        </View>
                    </View>

                    {/* Ngày sinh - Mở Modal tự dựng */}
                    <View style={styles.inputCard}>
                        <Text style={styles.label}>Ngày sinh</Text>
                        <TouchableOpacity
                            style={styles.inputRow}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Calendar size={20} color="#9ca3af" style={styles.inputIcon} />
                            <Text style={styles.inputText}>
                                {formatDate(formData.birthday)}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Component DatePicker tự dựng */}
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
                        style={styles.saveButtonWrapper}
                        onPress={() => router.back()}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButton}
                        >
                            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        padding: 4,
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

});