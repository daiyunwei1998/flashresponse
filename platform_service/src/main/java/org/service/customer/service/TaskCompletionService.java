package org.service.customer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.service.customer.dto.TaskCompletionMessage;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class TaskCompletionService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final RabbitAdmin rabbitAdmin;
    private final TopicExchange topicExchange;

    public TaskCompletionService(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper, RabbitAdmin rabbitAdmin, TopicExchange topicExchange) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
        this.rabbitAdmin = rabbitAdmin;
        this.topicExchange = topicExchange;
    }

    @RabbitListener(queues = "#{taskCompletionQueue.name}")
    public void receiveMessage(final TaskCompletionMessage message) {
        if (message == null) {
            log.error("Received null message!");
            return;
        }

        String tenantId = message.getTenantId();
        log.info("Received task completion message for tenant: {}", message);

        // Notify the frontend via WebSocket
        String queueName = tenantId + ".task_complete";
        Queue queue = new Queue(queueName, true);
        rabbitAdmin.declareQueue(queue);

        // Bind the queue to the topic exchange with a specific routing key
        Binding binding = BindingBuilder.bind(queue)
                .to(topicExchange)
                .with(tenantId + ".task_complete");
        rabbitAdmin.declareBinding(binding);

        // Send the message to the WebSocket topic
        messagingTemplate.convertAndSend("/topic/" + tenantId + ".task_complete", message);
    }
    
}

