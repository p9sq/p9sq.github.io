import pygame

BLACK = (0, 0, 0)

# This will be a class that comes from the graphics sprite class
# that's predefined in pygame
class Paddle(pygame.sprite.Sprite):
    # Next, we need to initialize the properties of the paddle
    # and then call its parent class, which is Sprite
    def __init__(self, color, width, height):
        super().__init__()

        # Define the Paddle color, position, width, and height
        # The background will be black and transparent
        self.image = pygame.Surface([width, height])
        self.image.fill(BLACK)

        # Using a rectangle to draw the paddle
        pygame.draw.rect(self.image, color, [0, 0, width, height])
        self.rect = self.image.get_rect()

    def goUp(self, pixels):
        self.rect.y -= pixels

        # Need to limit movement not to go beyond the screen
        if self.rect.y < 0:
            self.rect.y = 0

    def goDown(self, pixels):
        self.rect.y += pixels

        # Need to limit movement not to go beyond the screen
        if self.rect.y > 400:
            self.rect.y = 400
