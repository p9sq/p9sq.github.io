import pygame
from random import randint

BLACK = (0, 0, 0)

# The ball class works almost exactly like the paddle class we had earlier
class Ball(pygame.sprite.Sprite):
    def __init__(self, color, width, height):
        super().__init__()

        # Same as with the paddles, we need to draw the ball and give it attributes
        self.image = pygame.Surface([width, height])
        self.image.fill(BLACK)
        self.image.set_colorkey(BLACK)

        pygame.draw.rect(self.image, color, [0, 0, width, height])
        self.velocity = [randint(4, 8), randint(-8, 8)]
        self.rect = self.image.get_rect()

    def update(self):
        self.rect.x += self.velocity[0]
        self.rect.y += self.velocity[1]

    def bouncing(self):
        self.velocity[0] = -self.velocity[0]
        self.velocity[1] = randint(-8, 8)
