document.getElementById('tricky-text').addEventListener('mouseover', function() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const newLeft = Math.random() * (viewportWidth - this.offsetWidth);
    const newTop = Math.random() * (viewportHeight - this.offsetHeight);
    this.style.position = 'absolute';
    this.style.left = `${newLeft}px`;
    this.style.top = `${newTop}px`;
});
