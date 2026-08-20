import pygame
from paddle import Paddle
from ball import Ball

pygame.init()

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

size = (800, 600)
screen = pygame.display.set_mode(size)

pygame.display.set_caption("Pong Clone")

continue_playing = True
system_clock = pygame.time.Clock()

# Now we can create the actual paddles
paddle1 = Paddle(WHITE, 10, 100)
paddle1.rect.x = 20
paddle1.rect.y = 200

paddle2 = Paddle(WHITE, 10, 100)
paddle2.rect.x = 770
paddle2.rect.y = 200

ball = Ball(WHITE, 10, 10)
ball.rect.x = 395
ball.rect.y = 295

# We declare the paddle sprites we'll use
game_sprites = pygame.sprite.Group()
game_sprites.add(paddle1)
game_sprites.add(paddle2)
game_sprites.add(ball)

# Player score initialization
score1 = 0
score2 = 0

font = pygame.font.Font(None, 72)

# Main loop
while continue_playing:
    # Event loop where the player does something
    for event in pygame.event.get():
        # If the player closes the game he will exit
        if event.type == pygame.QUIT:
            continue_playing = False

    # Game logic
    game_sprites.update()

    # Paddle movement
    # Player 1 = W and S keys
    # Player 2 = arrow keys
    movement_keys = pygame.key.get_pressed()
    if movement_keys[pygame.K_w]:
        paddle1.goUp(5)

    if movement_keys[pygame.K_s]:
        paddle1.goDown(5)

    if movement_keys[pygame.K_UP]:
        paddle2.goUp(5)

    if movement_keys[pygame.K_DOWN]:
        paddle2.goDown(5)

    # Perform test to see if the ball bounces against the sides of the screen
    if ball.rect.x >= 790:
        score1 += 1
        ball.velocity[0] = -ball.velocity[0]

    if ball.rect.x <= 0:
        score2 += 1
        ball.velocity[0] = -ball.velocity[0]

    if ball.rect.y > 590:
        ball.velocity[1] = -ball.velocity[1]

    if ball.rect.y < 0:
        ball.velocity[1] = -ball.velocity[1]

    # Collision detection
    if pygame.sprite.collide_mask(ball, paddle1) or pygame.sprite.collide_mask(ball, paddle2):
        ball.bouncing()

    # Graphics
    # The background will be black
    screen.fill(BLACK)

    # We need to split the screen in half to mark the playing fields
    # Think of the net that splits the ping pong table
    pygame.draw.line(screen, WHITE, [399, 0], [399, 600], 5)

    game_sprites.draw(screen)

    # Handles the score display
    text = font.render(str(score1), 1, WHITE)
    screen.blit(text, (300, 10))
    text = font.render(str(score2), 1, WHITE)
    screen.blit(text, (470, 10))

    # Let's update the screen to see the graphics
    pygame.display.flip()

    # We want the game to refresh/update the screen
    # at a speed of 60 frames per second
    system_clock.tick(60)

# Close the game once the program loop stops running
pygame.quit()
