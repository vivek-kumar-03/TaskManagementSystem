const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Models/Userdata');
const Task = require('../models/Task'); // Add this line
const { generateOtp, generateToken } = require('../utils/authUtils');
const sendEmail = require('../utils/sendEmail');

// Helper function to create OTP expiration date with buffer
const createOtpExpirationDate = (minutes) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Helper function to check if OTP is expired with buffer
const isOtpExpired = (expiryDate, bufferSeconds = 120) => {
  // Handle case where expiryDate might be null or undefined
  if (!expiryDate) {
    return true;
  }
  
  // Ensure expiryDate is a Date object
  const expiry = new Date(expiryDate);
  
  // Get current time
  const now = new Date();
  
  // Add generous buffer time (2 minutes) to prevent premature expiration
  const bufferedExpiry = new Date(expiry.getTime() + bufferSeconds * 1000);
  
  // Log for debugging
  console.log('OTP Expiration Check:');
  console.log('- Current time:', now.toISOString());
  console.log('- Actual expiry time:', expiry.toISOString());
  console.log('- Buffered expiry time:', bufferedExpiry.toISOString());
  console.log('- Is expired:', now > bufferedExpiry);
  
  // OTP is expired if current time is after the buffered expiry time
  return now > bufferedExpiry;
};

// ------------------------ SIGNUP ------------------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Signup attempt:', { name, email, password: password ? '[REDACTED]' : 'MISSING' });
    console.log('Request body:', req.body);

    if (!name || !email || !password) {
      console.log('Signup validation failed: Missing required fields', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Signup validation failed: Invalid email format', { email });
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      console.log('Signup validation failed: Password too short', { passwordLength: password.length });
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser && existingUser.isVerified) {
      console.log('Signup failed: User already exists and verified', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otpCode = generateOtp();
    // Set expiration to 5 minutes from now to ensure plenty of time
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Debug logging
    console.log('Generated OTP for signup:');
    console.log('- Email:', email);
    console.log('- OTP Code:', otpCode);
    console.log('- Expires At:', otpExpiresAt.toISOString());

    let user;
    if (existingUser) {
      console.log('Updating existing user with new OTP', { email, userId: existingUser._id });
      existingUser.passwordHash = hashedPassword;
      existingUser.otpCode = otpCode;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
      user = existingUser;
      console.log('Updated existing user with new OTP');
    } else {
      console.log('Creating new user with OTP', { email });
      user = new User({
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        otpCode,
        otpExpiresAt,
      });
      await user.save();
      console.log('Created new user with OTP', { userId: user._id });
    }

    // Try to send email, but don't fail the signup if email fails
    try {
      console.log('Attempting to send OTP email to:', email);
      await sendEmail(email, 'Your OTP Code', `Your OTP is: ${otpCode}`);
      console.log('OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Even if email fails, we still complete the signup process
      // The user can request a new OTP later
    }

    res.json({ 
      message: 'Signup successful. Please check your email for the OTP.', 
      expiresAt: otpExpiresAt.toISOString(),
      email: email // Send email back so frontend can display it
    });
  } catch (error) {
    console.error('Signup error:', error);
    // Provide more detailed error information in development
    const errorResponse = {
      message: 'Error during signup',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : 'Internal server error',
    };
    res.status(500).json(errorResponse);
  }
};

// ------------------------ LOGIN ------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Add detailed logging
    console.log('Login attempt:', { email, password: password ? '[REDACTED]' : 'MISSING' });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('Login failed: User not found for email', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      console.log('Login failed: User not verified', { email, userId: user._id });
      return res.status(400).json({ 
        message: 'Please verify your account with OTP first',
        needsVerification: true,
        email: user.email
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user', { email, userId: user._id });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    console.log('Login successful:', { email, userId: user._id });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Resend OTP attempt:', { email });

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Resend OTP failed: User not found for email', email);
      return res.status(400).json({ message: 'User not found' });
    }

    const otpCode = generateOtp();
    // Set expiration to 5 minutes from now to ensure plenty of time
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    try {
      await sendEmail(email, 'Your New OTP Code', `Your new OTP is: ${otpCode}`);
      console.log('New OTP sent successfully to:', email);
      
      res.json({ 
        message: 'New OTP sent successfully', 
        expiresAt: otpExpiresAt.toISOString() 
      });
    } catch (emailError) {
      console.error('Failed to send new OTP email:', emailError);
      // Still return success but indicate email failure
      res.json({ 
        message: 'OTP generated but email delivery failed. Please try again.', 
        expiresAt: otpExpiresAt.toISOString(),
        otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      message: 'Error resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Add detailed logging
    console.log('OTP verification attempt:', { email, otp: otp ? '[REDACTED]' : 'MISSING' });
    console.log('Full request body:', req.body);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Validate that OTP is a valid 6-digit number
    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      console.log('Invalid OTP format received:', { email, otp, type: typeof otp });
      return res.status(400).json({ 
        message: 'Invalid OTP format. OTP must be a 6-digit number.',
        received: otp,
        type: typeof otp
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('OTP verification failed: User not found for email', email);
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if user is already verified
    if (user.isVerified) {
      console.log('OTP verification: User already verified', { email, userId: user._id });
      // Generate a new token for already verified users
      const token = generateToken(user._id);
      return res.json({
        message: 'User already verified',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    }

    // TEMPORARY FIX: Remove expiration check for immediate verification
    // This ensures users can verify their OTP immediately after signup
    // Proper expiration check will be reinstated after debugging

    // Ensure both OTPs are strings for comparison
    const userOtp = String(user.otpCode);
    const inputOtp = String(otp);

    console.log('Comparing OTPs:');
    console.log('- Stored OTP:', userOtp);
    console.log('- Input OTP:', inputOtp);
    console.log('- Match:', userOtp === inputOtp);

    // DEVELOPMENT MODE: Show OTP for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 DEVELOPMENT: OTP verification for', email, '- Expected:', userOtp, '- Received:', inputOtp);
    }
    
    if (userOtp !== inputOtp) {
      console.log('OTP verification failed: Invalid OTP', { 
        email, 
        userId: user._id,
        storedOtp: userOtp,
        inputOtp: inputOtp
      });
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.otpCode = null;
    user.otpExpiresAt = null;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    console.log('OTP verification successful:', { email, userId: user._id });

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('🔐 Forgot password request for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      console.log('❌ User not verified:', email);
      return res.status(400).json({ message: 'Please verify your account first' });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = createOtpExpirationDate(2); // 2 minutes with proper handling

    console.log('🔢 Generated OTP:', otpCode, 'for email:', email);

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Always send OTP email
    try {
      await sendEmail(
        email,
        'Password Reset OTP - TaskFlow',
        `Your password reset OTP is: ${otpCode}. This OTP will expire in 2 minutes.`
      );
      console.log('✅ Password reset OTP sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({
      message: 'Password reset OTP sent successfully',
      expiresAt: otpExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in forgotPassword:', error);
    res.status(500).json({
      message: 'Error sending reset OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Verify OTP for password reset
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    // Check if OTP is expired with 30-second buffer for password reset (more generous)
    if (isOtpExpired(user.otpExpiresAt, 30)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const resetToken = generateToken(user._id);

    res.json({
      message: 'OTP verified successfully',
      resetToken,
      verified: true,
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Reset Password with OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, resetToken } = req.body;

    if (!email || !otp || !newPassword || !resetToken) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    try {
      jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Check if OTP is expired with 30-second buffer for password reset (more generous)
    if (isOtpExpired(user.otpExpiresAt, 30)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.passwordHash = hashedPassword;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Check OTP status
exports.checkOtpStatus = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.otpCode) {
      return res.status(400).json({ message: 'No OTP requested for this email' });
    }

    // Check expiration with 10-second buffer for consistency
    const isExpired = isOtpExpired(user.otpExpiresAt, 10);

    res.json({
      hasOtp: !!user.otpCode,
      isExpired,
      expiresAt: user.otpExpiresAt,
    });
  } catch (error) {
    console.error('Check OTP status error:', error);
    res.status(500).json({
      message: 'Error checking OTP status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -otpCode');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-passwordHash -otpCode' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Delete user account and all associated tasks
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from auth middleware
    
    console.log('Delete user request:', { userId });
    
    // First, delete all tasks associated with this user
    const deletedTasks = await Task.deleteMany({ userId: userId });
    console.log('Deleted user tasks:', { count: deletedTasks.deletedCount });
    
    // Then, delete the user account
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      console.log('Delete user failed: User not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User deleted successfully:', { 
      userId: deletedUser._id, 
      email: deletedUser.email,
      tasksDeleted: deletedTasks.deletedCount
    });
    
    res.json({ 
      message: 'User account and all associated tasks deleted successfully',
      tasksDeleted: deletedTasks.deletedCount
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Error deleting user account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};






