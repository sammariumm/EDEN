const counterEl = document.querySelector('.counter');
const targetNumber = 9157;
const animationDuration = 6000; // Total animation time in ms
const spinUpTime = 2000; // Time to accelerate
const spinDownTime = 4000; // Time to decelerate
let animationStart;

function formatNumber(num) {
    return num.toString().padStart(targetNumber.toString().length, '0');
}

function animate(timestamp) {
    if (!animationStart) animationStart = timestamp;
    const elapsed = timestamp - animationStart;
    const progress = Math.min(elapsed / animationDuration, 1);

    if (progress < 1) {
        // Calculate current speed (ease in/out)
        let speed;
        if (elapsed < spinUpTime) {
            // Accelerating phase
            speed = 1 - Math.pow(1 - (elapsed / spinUpTime), 2);
        } else if (elapsed > animationDuration - spinDownTime) {
            // Decelerating phase
            const decelProgress = (elapsed - (animationDuration - spinDownTime)) / spinDownTime;
            speed = 1 - Math.pow(decelProgress, 3);
        } else {
            // Full speed phase
            speed = 1;
        }

        // Calculate current value with momentum
        const currentValue = Math.floor(
            targetNumber * progress + 
            (Math.random() * 1000 * (1 - progress) * speed)
        );

        counterEl.textContent = formatNumber(currentValue);
        requestAnimationFrame(animate);
    } else {
        // Animation complete
        counterEl.textContent = formatNumber(targetNumber);
        counterEl.style.color = '#3b4025';
    }
}

// Start animation
counterEl.style.color = '#3b4025';
requestAnimationFrame(animate);