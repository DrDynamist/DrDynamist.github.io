fetch('https://ipapi.co/json/')
.then(response => response.json())
.then(data => 
  {
    const country = data.country;
    let visitCount = localStorage.getItem(country) || 0;
    visitCount++;
    localStorage.setItem(country, visitCount);

  console.log(`Visits from ${country}: ${visitCount}`);
})

  
.catch(error => console.error('Error fetching IP info:', error));
