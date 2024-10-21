package org.service.customer.controller.v1;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.admin.AdminLoginRequest;
import org.service.customer.dto.api.ResponseDto;
import org.service.customer.utils.CookieUtil;
import org.service.customer.utils.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public AdminController(AuthenticationManager authenticationManager, JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @RequestMapping(value = "login", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handlePreflight() {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest adminLoginRequest, HttpServletResponse response) {
        // authenticate the user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        adminLoginRequest.getEmail(), adminLoginRequest.getPassword()
                )
        );

        // Generate the JWT token
        String jwt = jwtTokenProvider.generateToken(authentication);

        // Add the JWT to the cookie
        CookieUtil.addJwtToCookie(jwt, response);

        // Return response
        return ResponseEntity.ok().body(new ResponseDto<>("Admin login"));
    }
}
