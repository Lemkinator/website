const board = document.getElementById("game-board");
const snake = [];
let food = null;
let direction = "right";

// Create the snake's initial position
for (let i = 0; i < 5; i++) {
    const snakeUnit = document.createElement("div");
    snakeUnit.classList.add("snake-unit");
    snakeUnit.style.left = i * 10 + "px";
    snakeUnit.style.top = "0px";
    board.appendChild(snakeUnit);
    snake.push(snakeUnit);
}

// Add game over text
const gameOverText = document.createElement("div");
gameOverText.textContent = "Game Over";
gameOverText.style.display = "none";
gameOverText.style.fontSize = "24px";
gameOverText.style.color = "red";
gameOverText.style.textAlign = "center";
gameOverText.style.marginTop = "100px";
board.appendChild(gameOverText);

document.getElementById('restart').addEventListener('click', function () {
    initGameStart();
});



// Move the snake
setInterval(() => {
    let snakeHead = snake[snake.length - 1];
    let nextLeft = parseInt(snakeHead.style.left) + (direction === "right" ? 10 : direction === "left" ? -10 : 0);
    let nextTop = parseInt(snakeHead.style.top) + (direction === "down" ? 10 : direction === "up" ? -10 : 0);

    // Check if the snake hits a wall
    if (nextLeft < 0 || nextLeft >= board.offsetWidth || nextTop < 0 || nextTop >= board.offsetHeight) {
        clearInterval();
        gameOverText.style.display = "block";
        restartButton.style.display = "block";
        document.removeEventListener("keydown", moveSnake);
        return;
    }

    // Check if the snake eats the food
    if (nextLeft === parseInt(food.style.left) && nextTop === parseInt(food.style.top)) {
        board.removeChild(food);
        food = null;
        generateFood();
        const newUnit = document.createElement("div");
        newUnit.classList.add("snake-unit");
        board.appendChild(newUnit);
        snake.push(newUnit);
    } else {
        // Move the body of the snake
        for (let i = 0; i < snake.length - 1; i++) {
            snake[i].style.left = snake[i + 1].style.left;
            snake[i].style.top = snake[i + 1].style.top;
        }
    }

    // Move the head of the snake
    snakeHead = snake[snake.length - 1];
    snakeHead.style.left = nextLeft + "px";
    snakeHead.style.top = nextTop + "px";
}, 100);

// Change the direction of the snake
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            direction = "up";
            break;
        case "ArrowDown":
            direction = "down";
            break;
        case "ArrowLeft":
            direction = "left";
            break;
        case "ArrowRight":
            direction = "right";
            break;
    }
    event.preventDefault();
});

function generateFood() {
    if (food === null) {
        food = document.createElement("div");
        food.classList.add("food");
        board.appendChild(food);
    }

    // Generate random coordinates for the food
    const x = Math.floor(Math.random() * 50) * 10;
    const y = Math.floor(Math.random() * 50) * 10;
    food.style.left = x + "px";
    food.style.top = y + "px";
}

// Call the function to generate the first food
generateFood();
