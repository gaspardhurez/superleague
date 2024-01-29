let arrows = document.querySelectorAll(".calendarArrow")
let currentWeek = document.querySelector(".weekNav > div > h2:nth-child(2)")
let teamOneElements = document.querySelectorAll('.teamOne p');
let teamTwoElements = document.querySelectorAll('.teamTwo p');

if (currentWeek.textContent === "1") {
    arrows[0].setAttribute('disabled', '')
    arrows[0].style.cssText = 'background-color: #F4F5F6;'
    arrows[0].querySelector('span').style.cssText = 'color: #B7B8B9;'

    
}
if (currentWeek.textContent == 5) {
    arrows[1].setAttribute('disabled', '')
    arrows[1].style.cssText = 'background-color: #F4F5F6;'
    arrows[1].querySelector('span').style.cssText = 'color: #B7B8B9;'
}


arrows[0].addEventListener('click', () => {

    if (currentWeek.textContent == 5) {
        arrows[1].removeAttribute('disabled', '')
        arrows[1].style.cssText = '';
        arrows[1].querySelector('span').style.cssText = '';
    }
    if(currentWeek.textContent != "1") {
    fetch(`/calendar?matchday=${Number(currentWeek.textContent) - 1}`)
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            teamOneElements[i].textContent = data[i].team_one;
            teamTwoElements[i].textContent = data[i].team_two;
        }
        currentWeek.textContent--
        if (currentWeek.textContent === "1") {
            arrows[0].setAttribute('disabled', '')
            arrows[0].style.cssText = 'background-color: #F4F5F6;'
            arrows[0].querySelector('span').style.cssText = 'color: #B7B8B9;'
        }
        
    })
    
}})

arrows[1].addEventListener('click', () => {

    if (currentWeek.textContent == 1) {
        arrows[0].removeAttribute('disabled', '');
        arrows[0].style.cssText = '';
        arrows[0].querySelector('span').style.cssText = '';
    }

    if(currentWeek.textContent != "5") {
    fetch(`/calendar?matchday=${Number(currentWeek.textContent) +1}`)
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i < data.length; i++) {
            teamOneElements[i].textContent = data[i].team_one;
            teamTwoElements[i].textContent = data[i].team_two;
        }
        currentWeek.textContent++
        if (currentWeek.textContent == 5) {
            arrows[1].setAttribute('disabled', '')
            arrows[1].style.cssText = 'background-color: #F4F5F6;'
            arrows[1].querySelector('span').style.cssText = 'color: #B7B8B9;'
        }
    })
    
}})
    
