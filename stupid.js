document.getElementById('tricky-text').addEventListener('mouseover', function() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const offsetX = Math.random() * 50 - 25;
    const offsetY = Math.random() * 50 - 25;
    
    const rect = this.getBoundingClientRect();
    
    let newLeft = rect.left + offsetX;
    let newTop = rect.top + offsetY;
    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - rect.width));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - rect.height));
    
    this.style.position = 'absolute';
    this.style.left = `${newLeft}px`;
    this.style.top = `${newTop}px`;
});
