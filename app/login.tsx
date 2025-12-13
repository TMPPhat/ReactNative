import * as Crypto from 'expo-crypto'; // Import thư viện mã hóa
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail, MessageSquare } from 'lucide-react-native';
import React, { useEffect, useState } from 'react'; // Import useEffect
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import apiUser from '../api/apiUser';
import { useAuth } from '../context/AuthContext';

// --- CẤU HÌNH EMAILJS ---
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_4rqxodn',
  TEMPLATE_ID: 'template_v91vs9q',
  PUBLIC_KEY: 'LFTVau-pMSELmf49x',
};

// Component hiển thị Logo Google
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

// Component hiển thị Logo Apple
const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

// Define Colors
const COLORS = {
  background: '#eff6ff',
  foreground: '#1e3a8a',
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  muted: '#bfdbfe',
  mutedForeground: '#9ca3af',
  inputBackground: '#ffffff',
  border: '#e5e7eb',
  radius: 12,
  textLight: '#64748b', 
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Pass
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [generatedOtp, setGeneratedOtp] = useState(''); 
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null); // Lưu thời gian hết hạn OTP (Timestamp)
  const [timeLeft, setTimeLeft] = useState(0); // State đếm ngược (giây)

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  // --- Logic Đếm ngược OTP ---
  useEffect(() => {
    let timer: any; // Sửa lỗi Type: Dùng any để tương thích với cả web và native
    if (forgotStep === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotStep, timeLeft]);

  // Format thời gian hiển thị (MM:SS)
  const formatTimeLeft = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Handlers cho Login ---
  const handleLogin = async () => {
    if (!email || !password) {
       Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
       return;
    }
    await login(email, password);
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  // --- Handlers cho Forgot Password ---
  
  // Hàm tạo OTP ngẫu nhiên 6 số
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Bước 1: Kiểm tra Email & Gửi OTP qua EmailJS
  const handleSubmitEmail = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setIsResetLoading(true);

    try {
      // 1. Kiểm tra Email có tồn tại trên hệ thống không
      const checkRes = await apiUser.checkEmailExists(resetEmail);
      
      if (!checkRes.results || checkRes.results.length === 0) {
        Alert.alert('Lỗi', 'Email này chưa được đăng ký trong hệ thống.');
        setIsResetLoading(false);
        return;
      }

      // 2. Tạo OTP & Thời gian hết hạn (2 phút = 120 giây)
      const otp = generateOTP();
      const expiry = Date.now() + 2 * 60 * 1000;
      
      setGeneratedOtp(otp);
      setOtpExpiry(expiry);
      setTimeLeft(120); // Đặt thời gian đếm ngược 120s
      
      console.log('Generated OTP:', otp); 

      // 3. Gửi request đến EmailJS API
      const data = {
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: {
          to_email: resetEmail,
          otp_code: otp, 
          message: otp,
        }
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'origin': 'http://localhost',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Alert.alert('Thành công', `Mã OTP đã được gửi đến ${resetEmail}.`);
        setForgotStep(2); 
      } else {
        const errorText = await response.text();
        console.error('EmailJS Error:', errorText);
        Alert.alert('Lỗi', 'Không thể gửi email. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi quy trình quên mật khẩu:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra mạng.');
    } finally {
      setIsResetLoading(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleSubmitOtp = () => {
    if (otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Mã OTP phải có 6 chữ số.');
      return;
    }

    // Kiểm tra hết hạn theo timestamp hoặc theo bộ đếm
    if ((otpExpiry && Date.now() > otpExpiry) || timeLeft <= 0) {
        Alert.alert('Hết hạn', 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.', [
            { text: 'Gửi lại', onPress: () => { setForgotStep(1); setTimeLeft(0); } },
            { text: 'Đóng' }
        ]);
        return;
    }
    
    setIsResetLoading(true);
    
    setTimeout(() => {
      setIsResetLoading(false);
      if (otpCode === generatedOtp) {
        Alert.alert('Thành công', 'Xác thực OTP thành công!');
        setForgotStep(3); 
      } else {
        Alert.alert('Lỗi', 'Mã OTP không chính xác.');
      }
    }, 500);
  };

  // Bước 3: Đổi mật khẩu (Có mã hóa SHA-256)
  const handleSubmitNewPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    
    setIsResetLoading(true);

    try {
        const checkRes = await apiUser.checkEmailExists(resetEmail);
        if (checkRes.results && checkRes.results.length > 0) {
            const userId = checkRes.results[0].id;
            
            // --- MÃ HÓA MẬT KHẨU (SHA-256) ---
            const hashedPassword = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                newPassword
            );
            console.log('Original Password:', newPassword);
            console.log('Hashed Password:', hashedPassword);

            // Gọi API cập nhật password ĐÃ MÃ HÓA
            await apiUser.updateUser(userId, { password: hashedPassword });
            
            Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.', [
                { text: 'OK', onPress: closeForgotModal }
            ]);
        } else {
            Alert.alert('Lỗi', 'Không tìm thấy tài khoản để cập nhật.');
        }

    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        Alert.alert('Lỗi', 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    } finally {
        setIsResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setForgotStep(1);
    setResetEmail('');
    setOtpCode('');
    setGeneratedOtp('');
    setOtpExpiry(null);
    setTimeLeft(0); // Reset timer
    setNewPassword('');
    setConfirmNewPassword('');
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
          <Text style={styles.welcomeText}>Đăng nhập để tiếp tục</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Mail color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Lock color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={COLORS.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              {showPassword ? (
                <EyeOff color={COLORS.mutedForeground} size={20} />
              ) : (
                <Eye color={COLORS.mutedForeground} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => setForgotModalVisible(true)}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.primaryForeground} />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerTextContainer}>
              <Text style={styles.dividerText}>hoặc</Text>
            </View>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} disabled={isLoading}>
              <GoogleIcon />
              <Text style={styles.socialButtonText}>Tiếp tục với Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialButton, { backgroundColor: 'black' }]} disabled={isLoading}>
              <AppleIcon />
              <Text style={[styles.socialButtonText, { color: 'white' }]}>Tiếp tục với Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Chưa có tài khoản?{' '}
          </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
            <Text style={styles.signUpText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- FORGOT PASSWORD MODAL --- */}
      <Modal
        visible={forgotModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeForgotModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              {forgotStep > 1 && (
                <TouchableOpacity onPress={() => setForgotStep(forgotStep - 1)} style={styles.modalBackBtn}>
                   <ArrowLeft size={24} color={COLORS.textLight} />
                </TouchableOpacity>
              )}
              <Text style={styles.modalTitle}>
                {forgotStep === 1 ? 'Quên mật khẩu' : 
                 forgotStep === 2 ? 'Xác thực OTP' : 'Đặt lại mật khẩu'}
              </Text>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalCloseBtn}>
                 <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              
              {/* STEP 1: EMAIL */}
              {forgotStep === 1 && (
                <>
                  <Text style={styles.modalInstruction}>
                    Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu.
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập email của bạn"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.modalButton, isResetLoading && { opacity: 0.7 }]}
                    onPress={handleSubmitEmail}
                    disabled={isResetLoading}
                  >
                    {isResetLoading ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Gửi mã OTP</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2: OTP */}
              {forgotStep === 2 && (
                <>
                  <Text style={styles.modalInstruction}>
                    Mã xác thực 6 số đã được gửi đến {resetEmail}.
                  </Text>
                  
                  {/* Hiển thị thời gian đếm ngược */}
                  <View style={{alignItems: 'center', marginBottom: 12}}>
                    <Text style={{color: timeLeft > 0 ? COLORS.primary : 'red', fontWeight: '600'}}>
                       Hiệu lực còn lại: {formatTimeLeft(timeLeft)}
                    </Text>
                  </View>

                  <View style={styles.inputWrapper}>
                    <MessageSquare color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập mã OTP (6 số)"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.modalButton, isResetLoading && { opacity: 0.7 }]}
                    onPress={handleSubmitOtp}
                    disabled={isResetLoading || timeLeft <= 0}
                  >
                    {isResetLoading ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Xác nhận OTP</Text>}
                  </TouchableOpacity>
                  
                  {timeLeft <= 0 && (
                      <TouchableOpacity 
                        style={{marginTop: 12, alignItems: 'center'}}
                        onPress={() => { setForgotStep(1); setTimeLeft(0); }}
                      >
                         <Text style={{color: COLORS.primary}}>Gửi lại mã mới</Text>
                      </TouchableOpacity>
                  )}
                </>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {forgotStep === 3 && (
                <>
                  <Text style={styles.modalInstruction}>
                    Nhập mật khẩu mới cho tài khoản của bạn.
                  </Text>
                  <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
                    <KeyRound color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Mật khẩu mới"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                       {showNewPassword ? <EyeOff size={20} color={COLORS.mutedForeground}/> : <Eye size={20} color={COLORS.mutedForeground}/>}
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.inputWrapper}>
                    <KeyRound color={COLORS.mutedForeground} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor={COLORS.mutedForeground}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      secureTextEntry={!showNewPassword}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.modalButton, { marginTop: 24 }, isResetLoading && { opacity: 0.7 }]}
                    onPress={handleSubmitNewPassword}
                    disabled={isResetLoading}
                  >
                    {isResetLoading ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Cập nhật mật khẩu</Text>}
                  </TouchableOpacity>
                </>
              )}

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 60,
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRing: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  logoTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  welcomeText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.inputBackground,
    borderRadius: COLORS.radius,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '400',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: COLORS.radius,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
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
    backgroundColor: '#e2e8f0',
  },
  dividerTextContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  dividerText: {
    color: '#64748b',
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: COLORS.radius,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  socialButtonText: {
    marginLeft: 12,
    color: '#334155',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  signUpText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBackBtn: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  closeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalBody: {
    gap: 16,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});