package com.auction.auction_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String phone;
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean isBanned = false;

    @Column(nullable = false)
    private boolean isEmailVerified = false;

    // ✅ Dùng columnDefinition rõ ràng để Hibernate không bị lệch timezone
    @JsonIgnore
    private String emailVerificationToken;

    @Column(columnDefinition = "DATETIME(0)")
    private LocalDateTime emailVerificationTokenExpiry;

    @JsonIgnore
    private String resetPasswordToken;

    @Column(columnDefinition = "DATETIME(0)")
    private LocalDateTime resetPasswordTokenExpiry;

    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email    = email;
        this.password = password;
    }

    // ========================================
    // UserDetails — Spring Security cần
    // ========================================
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public boolean isAccountNonExpired()  { return true; }
    @Override public boolean isAccountNonLocked()   { return !isBanned; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()            { return isEmailVerified; }

    // ========================================
    // Getters & Setters
    // ========================================
    public Long getId()                  { return id; }

    @Override
    public String getUsername()          { return username; }
    public void setUsername(String v)    { this.username = v; }

    public String getEmail()             { return email; }
    public void setEmail(String v)       { this.email = v; }

    @Override
    public String getPassword()          { return password; }
    public void setPassword(String v)    { this.password = v; }

    public String getFullName()          { return fullName; }
    public void setFullName(String v)    { this.fullName = v; }

    public String getPhone()             { return phone; }
    public void setPhone(String v)       { this.phone = v; }

    public String getAddress()           { return address; }
    public void setAddress(String v)     { this.address = v; }

    public Role getRole()                { return role; }
    public void setRole(Role v)          { this.role = v; }

    public boolean isBanned()            { return isBanned; }
    public void setBanned(boolean v)     { this.isBanned = v; }

    public boolean isEmailVerified()     { return isEmailVerified; }
    public void setEmailVerified(boolean v) { this.isEmailVerified = v; }

    public String getEmailVerificationToken()              { return emailVerificationToken; }
    public void setEmailVerificationToken(String v)        { this.emailVerificationToken = v; }

    public LocalDateTime getEmailVerificationTokenExpiry() { return emailVerificationTokenExpiry; }
    public void setEmailVerificationTokenExpiry(LocalDateTime v) { this.emailVerificationTokenExpiry = v; }

    public String getResetPasswordToken()                  { return resetPasswordToken; }
    public void setResetPasswordToken(String v)            { this.resetPasswordToken = v; }

    public LocalDateTime getResetPasswordTokenExpiry()     { return resetPasswordTokenExpiry; }
    public void setResetPasswordTokenExpiry(LocalDateTime v) { this.resetPasswordTokenExpiry = v; }
}