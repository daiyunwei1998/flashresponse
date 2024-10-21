package org.service.customer.controller.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.api.ErrorDto;
import org.service.customer.dto.api.ResponseDto;
import org.service.customer.dto.user.LoginRequest;
import org.service.customer.dto.user.RegisterRequest;
import org.service.customer.dto.user.UpdateUserRequest;
import org.service.customer.dto.user.UserInfo;
import org.service.customer.models.CustomUserDetails;
import org.service.customer.models.User;
import org.service.customer.service.ChatService;
import org.service.customer.service.UserService;
import org.service.customer.utils.CookieUtil;
import org.service.customer.utils.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/tenants/{tenantId}/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private ChatService chatService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@PathVariable("tenantId") String tenantId, @Valid @RequestBody RegisterRequest registerRequest, HttpServletResponse response) {
        try {
            // Pass tenantId to the register request and AuthService
            registerRequest.setTenantId(tenantId);
            userService.registerUser(registerRequest);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            registerRequest.getEmail(), registerRequest.getPassword()
                    )
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String name = userDetails.getUser().getName();
            CookieUtil.setCookie("userName",name,response);
            Long id = userDetails.getUser().getId();
            CookieUtil.setCookie("userId",Long.toString(id),response);

            // Generate the JWT token
            String jwt = jwtTokenProvider.generateToken(authentication);
            // Add the JWT to the cookie
            CookieUtil.addJwtToCookie(jwt, response);

            // Add tenant id to cookie
            CookieUtil.addTenantIdToCookie(tenantId, response);

            // Return response
            return ResponseEntity.ok().body(new ResponseDto<>(jwt));

            //return new ResponseEntity<>(new ResponseDto("User registered successfully for tenant " + tenantId), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ResponseDto("Invalid input: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
                                   HttpServletResponse response) {
        // authenticate the user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(), loginRequest.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String name = userDetails.getUser().getName();
        CookieUtil.setCookie("userName",name,response);
        Long id = userDetails.getUser().getId();
        CookieUtil.setCookie("userId",Long.toString(id),response);

        // Generate the JWT token
        String jwt = jwtTokenProvider.generateToken(authentication);
        // Add the JWT to the cookie
        CookieUtil.addJwtToCookie(jwt, response);

        // Add tenant id to cookie
        CookieUtil.addTenantIdToCookie(tenantId, response);

        // Return response
        return ResponseEntity.ok().body(new ResponseDto<>(jwt));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear the cookie
        CookieUtil.clearCookie("jwt", response);
        CookieUtil.clearCookie("userName", response);
        CookieUtil.clearCookie("userId", response);
        CookieUtil.clearCookie("tenantId", response);

        // Return response
        return ResponseEntity.ok().body(new ResponseDto<>("logged out"));
    }


    // Fetch a user by ID (GET)
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("tenantId") String tenantId, @PathVariable("id") Long userId) {
        try {
            User user = userService.getUserById(userId, tenantId);
            return new ResponseEntity<>(new ResponseDto<>(user), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ErrorDto<>("User not found: " + e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    // Fetch all users for a tenant (GET)
    @GetMapping
    public ResponseEntity<?> getAllUsers(@PathVariable("tenantId") String tenantId) {
        List<User> users = userService.getAllUsers(tenantId);
        return new ResponseEntity<>(new ResponseDto<>(users), HttpStatus.OK);
    }

    // Update user info (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable("tenantId") String tenantId,
                                        @PathVariable("id") Long userId,
                                        @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        try {
            userService.updateUser(userId, tenantId, updateUserRequest);
            return new ResponseEntity<>(new ResponseDto("User updated successfully"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ResponseDto("Update failed: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    // Delete user (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable("tenantId") String tenantId, @PathVariable("id") Long userId) {
        try {
            userService.deleteUser(userId, tenantId);
            return new ResponseEntity<>(new ResponseDto("User deleted successfully"), HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(new ResponseDto("Delete failed: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveUsers(@PathVariable("tenantId") String tenantId) {
        List<UserInfo> users = chatService.getActiveUsers(tenantId);
        return new ResponseEntity<>(new ResponseDto<>(users), HttpStatus.OK);
    }
}
