document.addEventListener('DOMContentLoaded', () => {
    
    const easterEggBtn = document.getElementById('easter-egg-btn');

    if (easterEggBtn) {
        easterEggBtn.addEventListener('click', () => {
            
            easterEggBtn.innerText = "🚀";
            
            // Applies the specific blue colour effect
            document.body.classList.add('blue-colour-effect');
            
            setTimeout(() => {
                // Internal link! 
                // Adjust "three-demo.html" to whatever the exact file name of your solar portfolio is.
                window.location.href = "./three-demo.html";
            }, 1000);
            
        });
    }
    
});

