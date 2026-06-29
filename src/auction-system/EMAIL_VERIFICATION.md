# Email Verification Feature Documentation

## Overview

Email verification is now a required step before users can create auctions or place bids on the Auction System. This security feature ensures:

✅ Valid email addresses for all active users
✅ Prevents spam/bot accounts
✅ Ensures contact capability for winners and auction outcomes
✅ Protects against fraudulent activity

---

## User Registration Flow

```
1. User fills registration form
   ↓
2. Click "Đăng ký" button
   ↓
3. Backend generates UUID verification token (24-hour expiry)
   ↓
4. Email sent with verification link
   ↓
5. User redirected to "Check Your Email" page
   ↓
6. User clicks link in email
   ↓
7. Email marked as verified in database
   ↓
8. User can now create auctions and place bids
```

---

## Backend Implementation

### Database Changes

**User Entity** (`User.java`):
- `isEmailVerified` (boolean, default: false)
- `emailVerificationToken` (UUID string, nullable)
- `emailVerificationTokenExpiry` (LocalDateTime, nullable)

### New API Endpoints

#### 1. Register with Email Verification
```
POST /api/auth/register
Request:
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "fullName": "John Doe",
  "phone": "+84912345678"
}

Response:
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "phone": "+84912345678",
  "isEmailVerified": false,
  "role": "USER"
}
```

#### 2. Verify Email (from link in email)
```
GET /api/auth/verify-email?token=abc123xyz...

Response:
"Email has been verified successfully."

Status Codes:
- 200: Success
- 400: Invalid or expired token
```

#### 3. Resend Verification Email
```
POST /api/auth/resend-verification-email
Request:
{
  "email": "john@example.com"
}

Response:
"Verification email has been sent."
```

### Email Service Enhancement

**EmailService.java** now includes:

```java
// Send verification email
public void sendEmailVerificationEmail(String to, String verificationLink)

// Email template includes:
// - Professional HTML formatting
// - 24-hour expiration notice
// - Verification button with link
// - Console fallback for development
```

### Security Enforcement

**AuctionController.java**:
```java
@PostMapping(consumes = MULTIPART_FORM_DATA_VALUE)
public Auction createAuction(...) {
    if (!seller.isEmailVerified()) {
        throw new RuntimeException("Email must be verified before creating auction");
    }
    // ... rest of method
}
```

**BidController.java**:
```java
@PostMapping("/{auctionId}/bids")
public Bid placeBid(...) {
    if (!user.isEmailVerified()) {
        throw new RuntimeException("Email must be verified before placing bid");
    }
    // ... rest of method
}
```

---

## Frontend Implementation

### New Pages

#### 1. **VerifyEmailSent.jsx**
Shows after successful registration:
- Displays user's email address
- Instructions to check email (including spam folder)
- "Resend verification email" button
- 24-hour expiration warning

**Route**: `/verify-email-sent`

#### 2. **VerifyEmail.jsx**
Handles verification from email link:
- Extracts token from URL query parameter
- Displays loading spinner during verification
- Shows success message and redirects to login (2 sec delay)
- Shows error message if token invalid/expired

**Route**: `/verify-email?token=xyz`

### Updated Pages

#### Register.jsx
- After successful registration: redirects to `/verify-email-sent`
- Passes user's email via React Router state
- Better error handling

### Updated Routes (App.js)

```javascript
<Route path="/register" element={<Register />} />
<Route path="/verify-email-sent" element={<VerifyEmailSent />} />
<Route path="/verify-email" element={<VerifyEmail />} />
```

---

## Email Templates

### Verification Email Format

**Subject**: `Xác thực email - Auction System`

**Content**:
```
✉️ Xác thực Email

Cảm ơn bạn đã đăng ký tài khoản Auction System!

Vui lòng nhấp vào liên kết bên dưới để xác thực email của bạn:

[Xác thực Email button]

Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.

Lưu ý: Liên kết này sẽ hết hạn trong 24 giờ.
```

---

## Configuration

### Mail Setup (if sending actual emails)

See `MAIL_SETUP.md` for complete email configuration.

**For Testing** (without configuring SMTP):
- Emails will be printed to console
- Look for lines like:
  ```
  === EMAIL VERIFICATION EMAIL (Console Mode) ===
  To: user@example.com
  Verification Link: http://localhost:3000/verify-email?token=abc123...
  ```
- Copy the verification link and paste it into your browser

---

## Error Handling

### Registration Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already exists" | Email already registered | Use different email |
| "Đăng ký thất bại" | General registration failure | Check console logs |

### Verification Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid or expired token" | Token not found in DB | Request new verification email |
| "Token has expired" | Token older than 24 hours | Request new verification email |
| "Email is already verified" | User already verified | Proceed to login |

### Feature Access Errors

| Feature | Error | Solution |
|---------|-------|----------|
| Create Auction | "Email must be verified before creating auction" | Verify email first |
| Place Bid | "Email must be verified before placing bid" | Verify email first |

---

## Testing Checklist

- [ ] Register new user → Email verification email received
- [ ] Verify email with token → Status changes to verified
- [ ] Try creating auction before verification → Error message
- [ ] Verify email → Can now create auction
- [ ] Try placing bid before verification → Error message
- [ ] Verify email → Can now place bid
- [ ] Resend verification email → New token works
- [ ] Old token expired (24+ hours) → Cannot verify
- [ ] Invalid token format → Error message
- [ ] Console mode works (no SMTP configured)

---

## Future Enhancements

Possible improvements:

1. **Email Verification Reminders**
   - Send reminder if user doesn't verify after 1 hour
   - Resend after 24 hours

2. **Bulk Verification**
   - Admin endpoint to verify multiple users

3. **Verification Analytics**
   - Track verification rates
   - Monitor failed attempts

4. **Social Login Integration**
   - Skip verification for OAuth users (auto-verified)
   - GitHub, Google, Facebook login

5. **Admin Dashboard**
   - View verified vs unverified users
   - Manually verify users if needed

---

## Troubleshooting

### Emails not arriving

1. Check `MAIL_SETUP.md` for SMTP configuration
2. Check spam/junk folder
3. Verify Gmail App Password (if using Gmail)
4. Check console for error messages

### Token expired

1. Request new verification email via `/resend-verification-email`
2. Check token expiry: 24 hours from registration

### Cannot create auction after verification

1. Refresh page (JWT token may be stale)
2. Log out and log back in
3. Check user `isEmailVerified` status in database

---

## Database Queries (for debugging)

### Check unverified users
```sql
SELECT id, email, isEmailVerified FROM users WHERE isEmailVerified = false;
```

### Check verification tokens
```sql
SELECT id, email, emailVerificationToken, emailVerificationTokenExpiry 
FROM users 
WHERE emailVerificationToken IS NOT NULL;
```

### Clear old verification tokens (older than 24 hours)
```sql
UPDATE users 
SET emailVerificationToken = NULL, emailVerificationTokenExpiry = NULL 
WHERE emailVerificationTokenExpiry < NOW() AND emailVerificationToken IS NOT NULL;
```

---

## Security Best Practices

✅ **What we implemented:**
- UUID tokens (not guessable)
- 24-hour expiration
- One-time use (token cleared after verification)
- Database validation on every attempt
- Error messages don't reveal if email exists (prevents enumeration)

⚠️ **Additional recommendations:**
- Rate limit verification attempts (prevent brute force)
- Log verification attempts for audit
- Use HTTPS for email links
- Consider Two-Factor Authentication (2FA) later
- Implement bot detection (reCAPTCHA)

---

Generated: 2024
Auction System - Email Verification Module
