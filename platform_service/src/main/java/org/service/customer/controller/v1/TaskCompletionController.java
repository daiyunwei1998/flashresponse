package org.service.customer.controller.v1;

import lombok.extern.slf4j.Slf4j;
import org.service.customer.service.TaskCompletionService;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Slf4j
@Controller
public class TaskCompletionController {

    private final TaskCompletionService taskCompletionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RabbitAdmin rabbitAdmin;
    private final TopicExchange topicExchange;

    public TaskCompletionController(TaskCompletionService taskCompletionService, SimpMessagingTemplate messagingTemplate, RabbitAdmin rabbitAdmin, TopicExchange topicExchange) {
        this.taskCompletionService = taskCompletionService;
        this.messagingTemplate = messagingTemplate;
        this.rabbitAdmin = rabbitAdmin;
        this.topicExchange = topicExchange;
    }


    // WebSocket endpoint to notify frontend of task completion
    @GetMapping("/task/complete")
    public void notifyTaskComplete(String tenantId, String filename) {
        log.info("Notifying tenant {} of task completion for file {}", tenantId, filename);

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
        messagingTemplate.convertAndSend("/topic/" + tenantId + "./task_complete", filename);
    }
}

