document.getElementById('tricky-text').addEventListener('mouseover', function() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const offsetX = Math.random() * 100 - 50; 
    const offsetY = Math.random() * 100 - 50; 
    const rect = this.getBoundingClientRect();
    
    let newLeft = rect.left + offsetX;
    let newTop = rect.top + offsetY;
