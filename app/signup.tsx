import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, User, Square, CheckSquare } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

// Component hiển thị Logo Google (Tái sử dụng)
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </Svg>
);

// Component hiển thị Logo Apple (Tái sử dụng)
const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

// Define Colors based on CSS variables provided (Giống Login)
const COLORS = {
  background: '#ffffff',
  foreground: '#030213',
  primary: '#030213',
  primaryForeground: '#ffffff',
  muted: '#ececf0',
  mutedForeground: '#717182',
  inputBackground: '#f3f3f5',
  border: 'rgba(0, 0, 0, 0.1)',
  radius: 10,
};

export default function SignUpScreen() {
  const router = useRouter();
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = () => {
    console.log('Sign up:', formData);

    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Lỗi', 'Vui lòng đồng ý với điều khoản dịch vụ');
      return;
    }

    // TODO: Kết nối API Spring Boot (/api/auth/signup) tại đây
    Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
      { text: 'OK', onPress: () => router.back() } // Quay lại màn login
    ]);
  };

  const handleSwitchToLogin = () => {
    // Quay lại màn hình Login (giả sử Login là trang trước đó hoặc dùng replace)
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Logo/Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground} />
            <View style={styles.logoRing} />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>TMP.MP</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>Đăng ký để bắt đầu</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <User color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.name}
              onChangeText={(text) => updateField('name', text)}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Mail color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Lock color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff color={COLORS.mutedForeground} size={20} />
              ) : (
                <Eye color={COLORS.mutedForeground} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <Lock color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
              {showConfirmPassword ? (
                <EyeOff color={COLORS.mutedForeground} size={20} />
              ) : (
                <Eye color={COLORS.mutedForeground} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Terms and Conditions (Custom Checkbox) */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              onPress={() => setAgreeTerms(!agreeTerms)}
              style={styles.checkboxContainer}
            >
              {agreeTerms ? (
                <CheckSquare color={COLORS.primary} size={20} />
              ) : (
                <Square color={COLORS.mutedForeground} size={20} />
              )}
            </TouchableOpacity>
            
            <View style={styles.termsTextContainer}>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.linkText}>Điều khoản dịch vụ</Text>
                {' '}và{' '}
                <Text style={styles.linkText}>Chính sách bảo mật</Text>
              </Text>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSignUp}
            activeOpacity={0.8}
          >
            <Text style={styles.signupButtonText}>Đăng ký</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerTextContainer}>
              <Text style={styles.dividerText}>hoặc đăng ký với</Text>
            </View>
          </View>

          {/* Social Sign Up Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <GoogleIcon />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialButton, { backgroundColor: 'black' }]}>
              <AppleIcon />
              <Text style={[styles.socialButtonText, { color: 'white' }]}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Đã có tài khoản?{' '}
          </Text>
          <TouchableOpacity onPress={handleSwitchToLogin}>
            <Text style={styles.loginLinkText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  // Header Styles
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  logoContainer: {
    width: 80, // Nhỏ hơn Login một chút để tiết kiệm diện tích form
    height: 80,
    marginBottom: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoRing: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.muted,
    opacity: 0.6,
  },
  logoTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: COLORS.primaryForeground,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  welcomeText: {
    color: COLORS.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Form Styles
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 12, // Khoảng cách giữa các input
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.inputBackground,
    borderRadius: COLORS.radius,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.foreground,
    fontWeight: '400',
  },
  eyeButton: {
    padding: 4,
  },
  
  // Terms Styles
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Căn chỉnh top nếu text dài
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2, // Căn chỉnh với dòng text đầu tiên
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Signup Button
  signupButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: COLORS.radius,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    position: 'relative',
    height: 20,
    marginVertical: 24,
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.muted,
  },
  dividerTextContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  dividerText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
  },

  // Social Buttons
  socialContainer: {
    flexDirection: 'row', // Nằm ngang thay vì dọc để tiết kiệm không gian
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: COLORS.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    marginLeft: 8,
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  footerText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});