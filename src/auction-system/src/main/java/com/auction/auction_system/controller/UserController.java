package com.auction.auction_system.controller;

import com.auction.auction_system.dto.UpdateProfileRequest;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.UserRepository;
import com.auction.auction_system.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // GET PROFILE
    @GetMapping("/profile")
    public User getProfile(Authentication authentication) {
        User principal = (User) authentication.getPrincipal();
        return userRepository.findById(principal.getId())
                .orElse(principal);
    }

    // UPDATE PROFILE — trả về lỗi validation rõ ràng bằng tiếng Việt
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            BindingResult bindingResult,
            Authentication authentication
    ) {
        // ✅ Nếu có lỗi validation → trả về message tiếng Việt
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldErrors()
                    .stream()
                    .map(e -> e.getDefaultMessage())
                    .collect(Collectors.joining(", "));
            return ResponseEntity.badRequest().body(errorMsg);
        }

        User principal = (User) authentication.getPrincipal();
        User updated = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(updated);
    }

    // ===== ADMIN ONLY =====

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        return userService.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "Đã xóa người dùng #" + id;
    }
}