package org.service.customer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class StompWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Inject RabbitMQ properties if not using Spring Boot's auto-configuration
    @Value("${spring.websocket.stomp.broker-relay.host}")
    private String relayHost;

    @Value("${spring.websocket.stomp.broker-relay.port}")
    private int relayPort;

    @Value("${spring.websocket.stomp.broker-relay.login}")
    private String relayUser;

    @Value("${spring.websocket.stomp.broker-relay.passcode}")
    private String relayPasscode;

    @Value("${spring.websocket.stomp.broker-relay.virtual-host}")
    private String relayVirtualHost;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use RabbitMQ as the STOMP broker relay
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");

        config.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost(relayHost)
                .setRelayPort(relayPort)
                .setClientLogin(relayUser)
                .setClientPasscode(relayPasscode)
                .setSystemLogin(relayUser)
                .setSystemPasscode(relayPasscode)
                .setVirtualHost(relayVirtualHost);


    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setHandshakeHandler(new UserHandshakeHandler())
                .setAllowedOriginPatterns(
                        "http://localhost:3000",
                        "http://localhost:3001",
                        "http://203.204.185.67:3000",
                        "http://203.204.185.67:3001",
                        "http://www.yunweidai.net:3000",
                        "http://www.yunweidai.net:3001",
                        "https://flashresponse.net",
                        "http://flashresponse.net",
                        "https://*.flashresponse.net"       // Allows all subdomains over HTTPS
                )
                .withSockJS();
    }


}
